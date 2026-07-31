import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Review } from '../models/Review';
import { Order } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { memoryStore } from '../utils/store';
import { sendRestockAlertEmail } from '../utils/emailService';

const enrichProductWithReviews = (p: any) => {
  if (!p) return p;
  const targetObj = typeof p.toObject === 'function' ? p.toObject() : { ...p };

  const keys = new Set([
    String(targetObj._id || '').toLowerCase(),
    String(targetObj.id || '').toLowerCase(),
    String(targetObj.slug || '').toLowerCase(),
    String(targetObj.title || '').trim().toLowerCase()
  ].filter(Boolean));

  const matchingReviews = memoryStore.reviews.filter(r => {
    const rProd = String(r.product || '').toLowerCase().trim();
    return keys.has(rProd) || (targetObj.title && rProd.includes(targetObj.title.trim().toLowerCase()));
  });

  if (matchingReviews.length > 0) {
    const avg = matchingReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / matchingReviews.length;
    targetObj.rating = Number(avg.toFixed(1));
    targetObj.numReviews = matchingReviews.length;
  } else {
    targetObj.rating = targetObj.rating && targetObj.rating > 0 ? Number(targetObj.rating) : 5.0;
    targetObj.numReviews = targetObj.numReviews || 0;
  }

  return targetObj;
};

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
          const dbKeys = new Set<string>();
          dbProducts.forEach(p => {
            if (p._id) dbKeys.add(p._id.toString().toLowerCase());
            if ((p as any).id) dbKeys.add((p as any).id.toString().toLowerCase());
            if (p.slug) dbKeys.add(p.slug.toLowerCase());
            if (p.title) dbKeys.add(p.title.trim().toLowerCase());
          });

          const extraMemProducts = memoryStore.products.filter(p => {
            const pKeys = [p._id, p.id, p.slug, p.title?.trim()].filter(Boolean).map(k => k!.toString().toLowerCase());
            return !pKeys.some(k => dbKeys.has(k));
          });
          const combined = [...extraMemProducts, ...dbProducts];
          const paginatedCombined = combined.slice(0, limitNum).map(enrichProductWithReviews);

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
    let items = memoryStore.products.map(enrichProductWithReviews);

    if (search) {
      const s = String(search).toLowerCase();
      items = items.filter(
        p =>
          p.title.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          p.brand.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s) ||
          (p.tags && Array.isArray(p.tags) && p.tags.some((t: any) => String(t).toLowerCase().includes(s)))
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
    const cleanId = String(id).toLowerCase().trim();

    let productDoc: any = null;
    let dbReviews: any[] = [];

    // 1. Try finding in MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const cleanTitle = cleanId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const filter: any = mongoose.Types.ObjectId.isValid(id)
          ? { _id: id }
          : {
              $or: [
                { _id: id },
                { id: id },
                { slug: id },
                { title: new RegExp('^' + cleanTitle + '$', 'i') }
              ]
            };
        productDoc = await Product.findOne(filter);
        if (productDoc) {
          dbReviews = await Review.find({
            $or: [
              { product: productDoc._id },
              { product: String(productDoc._id) },
              { product: productDoc.id },
              { product: productDoc.slug },
              { product: cleanId }
            ]
          }).sort({ createdAt: -1 });
        }
      } catch (dbErr) {
        // Fallback
      }
    }

    // 2. Fallback to memoryStore
    const memProd = memoryStore.products.find(p => {
      const pId = String(p._id || p.id || '').toLowerCase();
      const pSlug = String(p.slug || '').toLowerCase();
      const pTitle = String(p.title || '').toLowerCase();
      return pId === cleanId || pSlug === cleanId || pTitle === cleanId || cleanId.includes(pTitle);
    });

    const targetProd = productDoc || memProd;
    if (!targetProd) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Collect all reviews from memoryStore + DB matching any product key
    const targetKeys = new Set([
      String(targetProd._id || '').toLowerCase(),
      String(targetProd.id || '').toLowerCase(),
      String(targetProd.slug || '').toLowerCase(),
      String(targetProd.title || '').toLowerCase(),
      cleanId
    ].filter(Boolean));

    const memReviews = memoryStore.reviews.filter(r => {
      const rProd = String(r.product || '').toLowerCase();
      return targetKeys.has(rProd);
    });

    // Merge and deduplicate reviews
    const reviewMap = new Map<string, any>();
    dbReviews.forEach(r => {
      reviewMap.set(String(r._id || r.id), r);
    });
    memReviews.forEach(r => {
      const rId = String(r._id || r.id || `${r.user}-${r.createdAt}`);
      if (!reviewMap.has(rId)) {
        reviewMap.set(rId, r);
      }
    });

    const combinedReviews = Array.from(reviewMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const enrichedProd = typeof targetProd.toObject === 'function' ? targetProd.toObject() : { ...targetProd };
    if (combinedReviews.length > 0) {
      const avg = combinedReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / combinedReviews.length;
      enrichedProd.rating = Number(avg.toFixed(1));
      enrichedProd.numReviews = combinedReviews.length;
    } else {
      enrichedProd.rating = enrichedProd.rating && enrichedProd.rating > 0 ? Number(enrichedProd.rating) : 5.0;
      enrichedProd.numReviews = enrichedProd.numReviews || 0;
    }

    return res.json({ product: enrichedProd, reviews: combinedReviews });
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
    const cleanId = String(id).toLowerCase().trim();
    const memProd = memoryStore.products.find(p => {
      const pId = String(p._id || p.id || '').toLowerCase();
      const pSlug = String(p.slug || '').toLowerCase();
      const pTitle = String(p.title || '').toLowerCase();
      return pId === cleanId || pSlug === cleanId || pTitle === cleanId || (titleToMatch && (pTitle.includes(titleToMatch) || titleToMatch.includes(pTitle)));
    });

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
      if (mongoose.connection.readyState === 1) {
        const cleanKey = String(id).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const filter: any = mongoose.Types.ObjectId.isValid(id)
          ? { _id: id }
          : {
              $or: [
                { _id: id },
                { id: id },
                { slug: new RegExp('^' + cleanKey + '$', 'i') },
                { title: new RegExp('^' + cleanKey + '$', 'i') }
              ]
            };
        if (titleToMatch) {
          filter.$or = filter.$or || [];
          filter.$or.push({ title: new RegExp('^' + titleToMatch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') });
        }

        const product = await Product.findOneAndUpdate(filter, updateData, { new: true });
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

    const targetProdId = String(id).toLowerCase();
    const userIdStr = String(user.id || user._id || '').toLowerCase();
    const userEmailStr = String(user.email || '').toLowerCase();

    // 1. Verify if user has a valid purchase order for this product
    let hasValidPurchase = false;

    // Check memoryStore orders
    for (const ord of memoryStore.orders) {
      const ordUser = String(
        typeof ord.user === 'object' ? (ord.user._id || ord.user.id || '') : (ord.user || (ord as any).userId || '')
      ).toLowerCase();
      const ordEmail = String(
        (ord as any).customerEmail || (ord as any).email || (typeof ord.user === 'object' ? ord.user.email : '') || (ord.shippingAddress?.email || '')
      ).toLowerCase();

      const isUserMatch = (userIdStr && ordUser === userIdStr) || (userEmailStr && ordEmail === userEmailStr);
      const st = String(ord.orderStatus || ord.fulfillmentStatus || '').toLowerCase();
      const isCancelled = st === 'cancelled' || st === 'refunded';

      if (isUserMatch && !isCancelled && Array.isArray(ord.orderItems)) {
        const itemMatch = ord.orderItems.some((item: any) => {
          const itemPId = String(item.product?._id || item.product?.id || item.product || item.id || '').toLowerCase();
          const itemTitle = String(item.title || item.name || '').toLowerCase();
          const itemSlug = String(item.slug || '').toLowerCase();
          return (
            (targetProdId && itemPId === targetProdId) ||
            (targetProdId && itemSlug === targetProdId) ||
            (itemTitle && targetProdId && (itemTitle.includes(targetProdId) || targetProdId.includes(itemTitle)))
          );
        });
        if (itemMatch) {
          hasValidPurchase = true;
          break;
        }
      }
    }

    // Check MongoDB orders if not found in memoryStore
    if (!hasValidPurchase && mongoose.connection.readyState === 1) {
      try {
        const cleanEmail = userEmailStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const dbOrders = await Order.find({
          $and: [
            {
              $or: [
                { user: user.id || user._id },
                { customerEmail: new RegExp(`^${cleanEmail}$`, 'i') },
                { 'shippingAddress.email': new RegExp(`^${cleanEmail}$`, 'i') }
              ]
            },
            { orderStatus: { $ne: 'Cancelled' } }
          ]
        });

        for (const ord of dbOrders) {
          if (Array.isArray(ord.orderItems)) {
            const itemMatch = ord.orderItems.some((item: any) => {
              const itemPId = String(item.product?._id || item.product?.id || item.product || item.id || '').toLowerCase();
              const itemTitle = String(item.title || item.name || '').toLowerCase();
              const itemSlug = String(item.slug || '').toLowerCase();
              return (
                (targetProdId && itemPId === targetProdId) ||
                (targetProdId && itemSlug === targetProdId) ||
                (itemTitle && targetProdId && (itemTitle.includes(targetProdId) || targetProdId.includes(itemTitle)))
              );
            });
            if (itemMatch) {
              hasValidPurchase = true;
              break;
            }
          }
        }
      } catch (dbErr) {
        // Fallback
      }
    }

    if (!hasValidPurchase) {
      return res.status(403).json({
        message: 'Only verified customers who have purchased this item can leave a review.'
      });
    }

    // 2. Create and persist review
    const newReview = {
      _id: 'rev-' + Date.now(),
      product: id,
      user: user.id || user._id,
      userName: user.name || 'Verified Buyer',
      userAvatar: user.avatar || '',
      rating: Number(rating),
      comment,
      isVerifiedBuyer: true,
      createdAt: new Date().toISOString()
    };

    memoryStore.reviews.unshift(newReview);
    memoryStore.saveReviews();

    if (mongoose.connection.readyState === 1) {
      try {
        await Review.create({
          product: id,
          user: user.id || user._id,
          name: user.name || 'Verified Buyer',
          rating: Number(rating),
          comment
        });
      } catch (err) {
        // Silent fallback
      }
    }

    // 3. Update product rating stats in memory, disk (data/products.json), and MongoDB
    const targetProdIdStr = String(id).toLowerCase().trim();
    const memProd = memoryStore.products.find(p => {
      const pId = String(p._id || p.id || '').toLowerCase();
      const pSlug = String(p.slug || '').toLowerCase();
      const pTitle = String(p.title || '').toLowerCase();
      return pId === targetProdIdStr || pSlug === targetProdIdStr || pTitle === targetProdIdStr || targetProdIdStr.includes(pTitle);
    });

    const targetKeys = new Set([
      targetProdIdStr,
      String(memProd?._id || '').toLowerCase(),
      String(memProd?.id || '').toLowerCase(),
      String(memProd?.slug || '').toLowerCase(),
      String(memProd?.title || '').toLowerCase()
    ].filter(Boolean));

    let finalRating = 5.0;
    let finalCount = 1;

    const allMatchingMemReviews = memoryStore.reviews.filter(r => targetKeys.has(String(r.product || '').toLowerCase()));
    if (allMatchingMemReviews.length > 0) {
      const avg = allMatchingMemReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / allMatchingMemReviews.length;
      finalRating = Number(avg.toFixed(1));
      finalCount = allMatchingMemReviews.length;

      if (memProd) {
        memProd.rating = finalRating;
        memProd.numReviews = finalCount;
      }

      memoryStore.products.forEach(p => {
        const pId = String(p._id || p.id || '').toLowerCase();
        const pSlug = String(p.slug || '').toLowerCase();
        const pTitle = String(p.title || '').toLowerCase();
        if (targetKeys.has(pId) || targetKeys.has(pSlug) || targetKeys.has(pTitle)) {
          p.rating = finalRating;
          p.numReviews = finalCount;
        }
      });
      memoryStore.saveProducts();
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const keyArray = Array.from(targetKeys);
        const dbReviews = await Review.find({ product: { $in: keyArray } });
        if (dbReviews && dbReviews.length > 0) {
          const avg = dbReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / dbReviews.length;
          finalRating = Number(avg.toFixed(1));
          finalCount = dbReviews.length;

          const cleanTitle = targetProdIdStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
          await Product.updateMany(
            {
              $or: [
                { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined },
                { id },
                { slug: id },
                { title: new RegExp('^' + cleanTitle + '$', 'i') }
              ].filter(Boolean)
            },
            {
              $set: {
                rating: finalRating,
                numReviews: finalCount
              }
            }
          );
        }
      } catch (err) {
        // Silent fallback
      }
    }

    return res.status(201).json({
      review: newReview,
      rating: finalRating,
      numReviews: finalCount,
      message: 'Review submitted successfully'
    });
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
