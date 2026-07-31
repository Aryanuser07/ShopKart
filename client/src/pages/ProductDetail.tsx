import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  ArrowLeft,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  Lock,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import api from '../services/api';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { InView } from '../components/core/in-view';
import { motion } from 'framer-motion';
import { getCustomProducts, saveCustomProduct } from '../utils/productStorage';
import { useCurrency } from '../utils/formatCurrency';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { format } = useCurrency();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Waitlist Modal State
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [isSubscribedToWaitlist, setIsSubscribedToWaitlist] = useState(false);
  const [waitlistToast, setWaitlistToast] = useState<string | null>(null);

  // Review Form
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewMsg, setReviewMsg] = useState<string>('');
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState<boolean>(false);

  const fetchProductDetails = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      const currentProd = res.data.product;
      setProduct(currentProd);
      setReviews(res.data.reviews || []);
      if (currentProd?.images?.length > 0) {
        setSelectedImage(prev => prev || currentProd.images[0]);
      }

      // Fetch Similar Products
      const allRes = await api.get('/products');
      const allProds: Product[] = allRes.data.products || [];
      const similar = allProds.filter(p =>
        (p._id !== currentProd._id && p.id !== currentProd.id) &&
        (p.category === currentProd.category || p.brand === currentProd.brand)
      ).slice(0, 4);
      setSimilarProducts(similar);
    } catch (err) {
      const custom = getCustomProducts();
      const found = custom.find(p => p._id === id || p.id === id || p.slug === id);
      if (found) {
        setProduct(found);
        if (found.images?.length > 0) setSelectedImage(prev => prev || found.images[0]);
        const similar = custom.filter(p => (p._id !== found._id && p.id !== found.id) && p.category === found.category).slice(0, 4);
        setSimilarProducts(similar);
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProductDetails(true);

    const handleProductsUpdated = () => {
      if (id) fetchProductDetails(false);
    };
    window.addEventListener('shopkart-products-updated', handleProductsUpdated);

    return () => {
      window.removeEventListener('shopkart-products-updated', handleProductsUpdated);
    };
  }, [id]);

  useEffect(() => {
    const checkDeliveredStatus = async () => {
      if (!user || !product) {
        setHasDeliveredOrder(false);
        return;
      }

      const targetId = (product._id || product.id || product.slug || '').toLowerCase();
      const targetTitle = (product.title || '').toLowerCase();

      const containsProduct = (orderList: any[]) => {
        if (!Array.isArray(orderList)) return false;
        return orderList.some((ord: any) => {
          const st = String(ord.orderStatus || ord.fulfillmentStatus || '').toLowerCase();
          if (st === 'cancelled' || st === 'refunded' || !Array.isArray(ord.orderItems)) return false;

          return ord.orderItems.some((item: any) => {
            const itemPId = String(item.product?._id || item.product?.id || item.product || item.id || '').toLowerCase();
            const itemTitle = String(item.title || item.name || '').toLowerCase();
            return (
              (targetId && itemPId === targetId) ||
              (targetTitle && itemTitle === targetTitle) ||
              (targetId && itemPId && (targetId.includes(itemPId) || itemPId.includes(targetId))) ||
              (targetTitle && itemTitle && (targetTitle.includes(itemTitle) || itemTitle.includes(targetTitle)))
            );
          });
        });
      };

      // 1. Check local storage orders first
      try {
        const localOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
        if (containsProduct(localOrders)) {
          setHasDeliveredOrder(true);
          return;
        }
      } catch (e) {
        // Silent fallback
      }

      // 2. Check API orders
      try {
        const res = await api.get('/orders/myorders');
        const myOrders = res.data.orders || res.data || [];
        if (containsProduct(myOrders)) {
          setHasDeliveredOrder(true);
          return;
        }
      } catch (e) {
        // Silent fallback
      }

      setHasDeliveredOrder(false);
    };

    checkDeliveredStatus();
  }, [user, product]);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    try {
      const waitlist = JSON.parse(localStorage.getItem('shopkart_waitlist') || '[]');
      waitlist.push({
        productId: product?._id || product?.id,
        productTitle: product?.title,
        email: waitlistEmail,
        joinedAt: new Date().toISOString()
      });
      localStorage.setItem('shopkart_waitlist', JSON.stringify(waitlist));
    } catch (e) {
      // Silent
    }

    setIsSubscribedToWaitlist(true);
    setWaitlistToast(`✅ You're on the waitlist! We'll email ${waitlistEmail} the instant stock arrives.`);
    setIsWaitlistModalOpen(false);
    setTimeout(() => setWaitlistToast(null), 5000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setSubmittingReview(true);
    setReviewMsg('');
    try {
      const res = await api.post(`/products/${id}/reviews`, {
        rating: ratingInput,
        comment: commentInput
      });

      const newReview = res.data.review;
      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);

      const newCount = res.data.numReviews ?? updatedReviews.length;
      const newAvg = res.data.rating ?? Number((updatedReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / updatedReviews.length).toFixed(1));

      if (product) {
        const updatedProd: Product = {
          ...product,
          rating: newAvg,
          numReviews: newCount
        };
        setProduct(updatedProd);
        saveCustomProduct(updatedProd);
        window.dispatchEvent(new Event('shopkart-products-updated'));
      }

      setCommentInput('');
      setReviewMsg('✅ Thank you! Your review has been published.');
      setTimeout(() => setReviewMsg(''), 4000);
    } catch (err: any) {
      setReviewMsg(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-[#eb9800] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="inline-block px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const prodId = product._id || product.id;
  const isWishlisted = isInWishlist(prodId);
  const isOutOfStock = (product.stock ?? 0) <= 0;

  // Expected restock date (~5 days from now)
  const restockDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const liveNumReviews = reviews.length > 0 ? reviews.length : (product.numReviews || 0);
  const liveAvgRating = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1))
    : (product.rating || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 bg-[#faf9f6]">

      {/* Waitlist Success Toast */}
      {waitlistToast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{waitlistToast}</span>
          </div>
          <button onClick={() => setWaitlistToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
        <button onClick={() => navigate(-1)} className="hover:text-slate-900 flex items-center space-x-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-900">Products</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.title}</span>
      </div>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className={`relative aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-md ${isOutOfStock ? 'opacity-75 grayscale-[20%]' : ''}`}>
            <img
              src={selectedImage || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {isOutOfStock && (
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-extrabold uppercase px-3 py-1.5 rounded-full shadow-xs flex items-center space-x-1.5 border border-slate-700">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Currently Unavailable</span>
              </div>
            )}
          </div>

          {product.images?.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition ${
                    selectedImage === img ? 'border-[#eb9800] ring-2 ring-amber-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#eb9800] uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242b27] tracking-tight">
              {product.title}
            </h1>

            {/* Ratings */}
            <div className="flex items-center space-x-3 pt-1">
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${liveNumReviews > 0 && i < Math.floor(liveAvgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-900">{liveNumReviews > 0 ? liveAvgRating : '0.0'}</span>
              <span className="text-xs text-slate-400">({liveNumReviews} customer {liveNumReviews === 1 ? 'review' : 'reviews'})</span>
            </div>

            {/* Price Banner */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-baseline space-x-3 mt-3">
              <span className="text-3xl font-black text-slate-900">{format(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm font-semibold text-slate-400 line-through">
                  {format(product.originalPrice)}
                </span>
              )}

              {/* Subtle Stock Badge */}
              {!isOutOfStock ? (
                <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {product.stock} In Stock
                </span>
              ) : (
                <span className="ml-auto text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Currently Unavailable</span>
                </span>
              )}
            </div>

            {/* Expected Restock Banner for Out-of-Stock Products */}
            {isOutOfStock && (
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-start space-x-3 text-xs text-amber-950 mt-3 shadow-xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-amber-900 flex items-center space-x-2">
                    <span>Expected Restock: {restockDate}</span>
                    <span className="bg-amber-200/60 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">Shipment Scheduled</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium">
                    This variant is temporarily out of stock. Join the waitlist below to get notified the second fresh stock lands!
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed font-medium pt-2">
              {product.description}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4 pt-2">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                <button
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-extrabold text-slate-900">{!isOutOfStock ? quantity : 0}</span>
                <button
                  disabled={quantity >= (product.stock ?? 0) || isOutOfStock}
                  onClick={() => setQuantity(prev => Math.min(product.stock ?? 0, prev + 1))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!isOutOfStock ? (
                <button
                  onClick={() => addToCart(product, quantity)}
                  className="btn-animated-fill btn-animated-gold py-3.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsWaitlistModalOpen(true)}
                  className="py-3.5 px-6 rounded-xl font-bold text-xs bg-[#242b27] hover:bg-black text-white flex items-center justify-center space-x-2 shadow-md transition"
                >
                  <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>{isSubscribedToWaitlist ? 'Waitlist Joined ✓' : 'Notify Me When Available'}</span>
                </button>
              )}

              <button
                onClick={() => toggleWishlist(prodId)}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs transition border flex items-center justify-center space-x-2 ${
                  isWishlisted
                    ? 'bg-pink-50 text-pink-700 border-pink-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
                <span>{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>

            {/* Service Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500 font-medium text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-200 flex flex-col items-center">
                <Truck className="w-4 h-4 text-indigo-600 mb-1" />
                <span>Free Pan-India Delivery</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200 flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span>2 Year Warranty</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200 flex flex-col items-center">
                <RotateCcw className="w-4 h-4 text-amber-600 mb-1" />
                <span>30 Days Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Ratings Section */}
      <div className="pt-8 border-t border-slate-200 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#242b27] tracking-tight flex items-center space-x-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>Customer Reviews & Ratings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
              <span>Verified ratings from customers who purchased this item</span>
              <span>•</span>
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                <UserCheck className="w-3 h-3 mr-1 text-emerald-600" />
                Verified Buyer Reviews Only
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-center pr-4 border-r border-slate-200">
              <span className="text-2xl font-black text-[#242b27]">
                {(reviews.length > 0 || (product.numReviews || 0) > 0) ? (product.rating || 5.0) : '0.0'}
              </span>
              <span className="text-xs text-slate-400 font-bold block">out of 5</span>
            </div>
            <div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      (reviews.length > 0 || (product.numReviews || 0) > 0) && s <= Math.round(product.rating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-semibold block mt-1">
                Based on {reviews.length || product.numReviews || 0} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Review Form or Verification Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-[#242b27] flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[#eb9800]" />
            <span>Write a Product Review</span>
          </h3>

          {!user ? (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs font-semibold text-amber-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please log in to your account to write a review.</span>
              </div>
              <Link to="/profile" className="px-3.5 py-1.5 bg-[#242b27] text-white font-bold rounded-xl hover:bg-black transition">
                Log In
              </Link>
            </div>
          ) : !hasDeliveredOrder ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-100/70 text-amber-800 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900">Verified Purchase Required</h4>
                <p className="mt-0.5 text-slate-500">
                  Only customers who have purchased this product and received delivery can leave a review. Order this item to share your feedback!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
              {reviewMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  reviewMsg.includes('published') || reviewMsg.includes('success') || reviewMsg.includes('Thank')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {reviewMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Your Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star className={`w-6 h-6 ${star <= ratingInput ? 'fill-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-slate-700 ml-2">{ratingInput} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Honest Feedback</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What did you like or dislike about this product? How is the build quality and performance?"
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#eb9800]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 bg-[#242b27] hover:bg-black text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center space-x-2 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#eb9800]" />
                  <span>{submittingReview ? 'Submitting...' : 'Publish Verified Review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-[#242b27]">Customer Feedback ({reviews.length})</h3>

          {reviews.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-3xl border border-slate-200/80">
              <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No Customer Reviews Yet</p>
              <p className="text-[11px] text-slate-400">Be the first verified buyer to leave a review once delivered!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev: any) => (
                <div key={rev._id || rev.id || Math.random()} className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                        {rev.userAvatar ? (
                          <img src={rev.userAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (rev.userName || rev.name || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold text-[#242b27]">{rev.userName || rev.name || 'Verified Buyer'}</span>
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Verified Buyer
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Similar Products (for all items, especially when Out-of-Stock) */}
      {similarProducts.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#242b27] tracking-tight flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#eb9800]" />
                <span>Similar Available Alternatives</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore in-stock items from {product.category} ready for immediate dispatch
              </p>
            </div>
            <Link to="/products" className="text-xs font-bold text-[#eb9800] hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map(sim => (
              <div key={sim._id || sim.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-xs hover:shadow-md transition">
                <Link to={`/product/${sim._id || sim.id}`} className="block relative aspect-square rounded-xl overflow-hidden bg-slate-50">
                  <img src={sim.images[0]} alt={sim.title} className="w-full h-full object-cover" />
                </Link>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#eb9800] uppercase tracking-wider">{sim.category}</span>
                  <Link to={`/product/${sim._id || sim.id}`} className="block text-xs font-extrabold text-[#242b27] truncate hover:text-[#eb9800]">
                    {sim.title}
                  </Link>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-black text-[#242b27]">{format(sim.price)}</span>
                    <button
                      onClick={() => addToCart(sim, 1)}
                      className="px-3 py-1.5 bg-[#242b27] hover:bg-black text-white text-[11px] font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <ShoppingBag className="w-3 h-3 text-[#eb9800]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-[#eb9800]" />
                <h3 className="text-base font-extrabold text-[#242b27]">Back in Stock Waitlist</h3>
              </div>
              <button onClick={() => setIsWaitlistModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-[#faf9f6] rounded-2xl border border-slate-200">
              <img src={product.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#242b27] truncate">{product.title}</p>
                <p className="text-[11px] text-amber-700 font-semibold">Expected Restock: {restockDate}</p>
              </div>
            </div>

            <form onSubmit={handleJoinWaitlist} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#242b27] font-bold focus:outline-none focus:border-[#eb9800]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsWaitlistModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#242b27] text-white text-xs font-bold rounded-xl hover:bg-black transition flex items-center space-x-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-[#eb9800]" />
                  <span>Notify Me</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetail;
