import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Review } from '../models/Review';
import { AuthRequest } from '../middleware/auth';
import { memoryStore } from '../utils/store';
import { sendRestockAlertEmail } from '../utils/emailService';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, rating, sort } = req.query;
    
    // Parse page and limit with safety caps (default limit 12, max limit 50)
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const requestedLimit = Number(req.query.limit) || 12;
    const limitNum = Math.min(50, Math.max(1, requestedLimit));

    let queryFilter: any = {};

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      queryFilter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { tags: searchRegex }
      ];
    }

    if (category && category !== 'All') {
      queryFilter.category = new RegExp('^' + String(category) + '$', 'i');
    }

    if (minPrice || maxPrice) {
      queryFilter.price = {};
      if (minPrice) queryFilter.price.$gte = Number(minPrice);
      if (maxPrice) queryFilter.price.$lte = Number(maxPrice);
    }

    if (rating) {
      queryFilter.rating = { $gte: Number(rating) };
    }

    // Try MongoDB query if connected
    if (mongoose.connection.readyState === 1) {
      try {
        let sortOption: any = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };
        if (sort === 'popular') sortOption = { numReviews: -1 };

        const skip = (pageNum - 1) * limitNum;

        const dbProducts = await Product.find(queryFilter)
          .sort(sortOption)
          .skip(skip)
          .limit(limitNum);

        const total = await Product.countDocuments(queryFilter);

        if (dbProducts && dbProducts.length > 0) {
          const dbIds = new Set(dbProducts.map(p => (p._id || p.id).toString()));
          const extraMemProducts = memoryStore.products.filter(p => !dbIds.has((p._id || p.id).toString()));
          const combined = [...extraMemProducts, ...dbProducts];
          const paginatedCombined = combined.slice(0, limitNum);

          return res.json({
            products: paginatedCombined,
            page: pageNum,
            pages: Math.ceil((total + extraMemProducts.length) / limitNum) || 1,
            total: total + extraMemProducts.length
          });
        }
      } catch (dbErr) {
        // Fall through to memory store
      }
    }

    // Memory Store filtering
    let items = [...memoryStore.products];

    if (search) {
      const s = String(search).toLowerCase();
      items = items.filter(
        p =>
          p.title.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          p.brand.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s) ||
          p.tags.some(t => t.toLowerCase().includes(s))
      );
    }

    if (category && category !== 'All') {
      const catStr = String(category).toLowerCase();
      items = items.filter(p => p.category.toLowerCase() === catStr);
    }

    if (minPrice) items = items.filter(p => p.price >= Number(minPrice));
    if (maxPrice) items = items.filter(p => p.price <= Number(maxPrice));
    if (rating) items = items.filter(p => p.rating >= Number(rating));

    if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') items.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popular') items.sort((a, b) => b.numReviews - a.numReviews);

    const total = items.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);

    return res.json({
      products: paginatedItems,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    try {
      const product = await Product.findById(id);
      if (product) {
        const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });
        return res.json({ product, reviews });
      }
    } catch (dbErr) {
      // Memory Store fallback
    }

    const memProd = memoryStore.products.find(p => p._id === id || p.id === id || p.slug === id);
    if (memProd) {
      const reviews = memoryStore.reviews.filter(r => r.product === memProd._id || r.product === memProd.id);
      return res.json({ product: memProd, reviews });
    }

    return res.status(404).json({ message: 'Product not found' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    try {
      const categories = await Category.find();
      if (categories && categories.length > 0) {
        return res.json({ categories });
      }
    } catch (err) {
      // Fallback
    }

    return res.json({ categories: memoryStore.categories });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, price, originalPrice, category, brand, stock, images, features, isFeatured, tags, _id, id, slug: customSlug } = req.body;

    if (!title || !price) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    const prodId = _id || id || 'prod-' + Date.now();
    const slug = customSlug || (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    const defaultImage = images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'];
    const descStr = description || `${title} - Premium ShopKart Item`;
    const catStr = category || 'Electronics';

    const newMemProd = {
      _id: prodId,
      id: prodId,
      title,
      slug,
      description: descStr,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: catStr,
      brand: brand || 'ShopKart',
      stock: typeof stock !== 'undefined' && stock !== null && stock !== '' ? Number(stock) : 0,
      images: defaultImage,
      rating: 5.0,
      numReviews: 1,
      features: features || [],
      isFeatured: Boolean(isFeatured),
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Replace if existing memoryStore product has same title or ID to prevent duplicates
    const existingIdx = memoryStore.products.findIndex(p =>
      (p._id && p._id === prodId) ||
      (p.id && p.id === prodId) ||
      (p.title && p.title.trim().toLowerCase() === title.trim().toLowerCase())
    );

    if (existingIdx > -1) {
      memoryStore.products[existingIdx] = newMemProd;
    } else {
      memoryStore.products.unshift(newMemProd);
    }
    memoryStore.saveProducts();

    try {
      const product = await Product.create({
        title,
        slug,
        description: descStr,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category: catStr,
        brand: brand || 'ShopKart',
        stock: typeof stock !== 'undefined' && stock !== null && stock !== '' ? Number(stock) : 0,
        images: defaultImage,
        features: features || [],
        isFeatured: Boolean(isFeatured),
        tags: tags || []
      });

      return res.status(201).json({ product });
    } catch (dbErr) {
      return res.status(201).json({ product: newMemProd });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Always update memoryStore.products first to ensure consistency across memoryStore
    const titleToMatch = (updateData.title || '').trim().toLowerCase();
    const memProd = memoryStore.products.find(p =>
      p._id === id ||
      p.id === id ||
      p.slug === id ||
      (titleToMatch && p.title && p.title.trim().toLowerCase().includes(titleToMatch))
    );

    if (memProd) {
      const oldStock = memProd.stock || 0;
      Object.assign(memProd, updateData, { updatedAt: new Date().toISOString() });
      memoryStore.saveProducts();

      // ONLY trigger restock alert email when product was previously OUT OF STOCK (oldStock <= 0) and is now restocked (> 0),
      // OR when explicit waitlistEmails are passed in the request body.
      const hasWaitlist = Array.isArray(updateData.waitlistEmails) && updateData.waitlistEmails.length > 0;
      const isRestockedFromZero = oldStock <= 0 && Number(updateData.stock) > 0;

      if (isRestockedFromZero || hasWaitlist) {
        const prodTitle = memProd.title || updateData.title || 'Product';
        const waitlistEmails: string[] = Array.isArray(updateData.waitlistEmails) ? updateData.waitlistEmails : [];
        
        const recipientEmails = new Set<string>();
        
        // Add explicit waitlisted shopper emails
        waitlistEmails.forEach(e => {
          if (e && typeof e === 'string' && e.includes('@')) {
            recipientEmails.add(e.trim().toLowerCase());
          }
        });

        // Include configured admin email when actual waitlist members exist
        if (waitlistEmails.length > 0) {
          const adminEmail = (process.env.EMAIL_USER || 'rawataryan55@gmail.com').trim().toLowerCase();
          recipientEmails.add(adminEmail);
        }

        // Dispatch Gmail SMTP restock emails to waitlist subscribers
        recipientEmails.forEach(email => {
          sendRestockAlertEmail(email, prodTitle);
        });
      }
    }

    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        if (product) {
          return res.json({ product });
        }
      }
    } catch (err) {
      // Fallback
    }

    if (memProd) {
      return res.json({ product: memProd });
    }

    return res.status(404).json({ message: 'Product not found' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const targetKey = id.toString().toLowerCase();

    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Product.findByIdAndDelete(id);
      }
      const searchPattern = new RegExp(`^${targetKey.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');
      await Product.deleteMany({
        $or: [
          { _id: id },
          { id: id },
          { slug: searchPattern },
          { title: searchPattern }
        ]
      });
    } catch (err) {
      // Fallback
    }

    memoryStore.products = memoryStore.products.filter(p => {
      const matchId = (p._id || '').toLowerCase();
      const matchId2 = (p.id || '').toLowerCase();
      const matchSlug = (p.slug || '').toLowerCase();
      const matchTitle = (p.title || '').trim().toLowerCase();
      return matchId !== targetKey && matchId2 !== targetKey && matchSlug !== targetKey && matchTitle !== targetKey;
    });
    memoryStore.saveProducts();

    return res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'Authentication required' });
    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required' });

    const newReview = {
      _id: 'rev-' + Date.now(),
      product: id,
      user: user.id || user._id,
      userName: user.name,
      userAvatar: user.avatar,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };

    memoryStore.reviews.unshift(newReview);

    // Update product rating stats in memory
    const memProd = memoryStore.products.find(p => p._id === id || p.id === id);
    if (memProd) {
      const prodReviews = memoryStore.reviews.filter(r => r.product === id);
      const avgRating = prodReviews.reduce((acc, curr) => acc + curr.rating, 0) / prodReviews.length;
      memProd.rating = Number(avgRating.toFixed(1));
      memProd.numReviews = prodReviews.length;
    }

    return res.status(201).json({ review: newReview, message: 'Review submitted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const syncProduct = async (req: Request, res: Response) => {
  try {
    const { product, products } = req.body;
    const prodsToSync = Array.isArray(products) ? products : product ? [product] : [];

    prodsToSync.forEach((p: any) => {
      if (!p) return;
      const pId = String(p._id || p.id || '').toLowerCase();
      if (!pId) return;

      const existingIndex = memoryStore.products.findIndex(m => {
        const mId = String(m._id || m.id || '').toLowerCase();
        return mId === pId || m.slug === p.slug;
      });

      const formattedProduct: any = {
        _id: p._id || p.id || `prod-${Date.now()}`,
        id: p.id || p._id || `prod-${Date.now()}`,
        title: p.title || 'Untitled Product',
        slug: p.slug || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`),
        description: p.description || '',
        price: Number(p.price) || 0,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
        category: p.category || 'General',
        brand: p.brand || 'ShopKart',
        stock: typeof p.stock !== 'undefined' && p.stock !== null && p.stock !== '' ? Number(p.stock) : 0,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
        rating: Number(p.rating) || 4.5,
        numReviews: Number(p.numReviews) || 12,
        features: Array.isArray(p.features) ? p.features : [],
        isFeatured: Boolean(p.isFeatured),
        tags: Array.isArray(p.tags) ? p.tags : [],
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString()
      };

      if (existingIndex >= 0) {
        memoryStore.products[existingIndex] = { ...memoryStore.products[existingIndex], ...formattedProduct };
      } else {
        memoryStore.products.unshift(formattedProduct);
      }
    });
    memoryStore.saveProducts();

    return res.json({ success: true, count: memoryStore.products.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
