import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../utils/formatCurrency';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cartItems } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { format } = useCurrency();

  const prodId = product._id || product.id;
  const isWishlisted = isInWishlist(prodId);
  const inCart = cartItems.some(item => (item.product._id || item.product.id) === prodId);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white border border-slate-200/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl flex flex-col backdrop-blur-md"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link to={`/product/${prodId}`}>
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-xs">
            {product.category}
          </span>
          {discount > 0 && product.stock > 0 && (
            <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-xs">
              {discount}% OFF
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-slate-900/90 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-xs border border-slate-700">
              Currently Unavailable
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(prodId)}
          className={`absolute top-3 right-3 p-2.5 rounded-xl backdrop-blur-md transition-all shadow-md z-10 ${
            isWishlisted
              ? 'bg-pink-500 text-white shadow-pink-500/30'
              : 'bg-white/90 text-slate-400 hover:text-pink-500 hover:bg-white border border-slate-200'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-1.5 mb-1.5">
            <div className="flex items-center text-amber-500">
              <Star className={`w-3.5 h-3.5 ${product.numReviews && product.numReviews > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300 fill-transparent'}`} />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {product.numReviews && product.numReviews > 0 ? product.rating : '0.0'}
            </span>
            <span className="text-[11px] text-slate-400">({product.numReviews || 0})</span>
            <span className="text-[11px] text-slate-400">• {product.brand}</span>
          </div>

          <Link to={`/product/${prodId}`}>
            <h3 className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-cyan-600 transition mb-2">
              {product.title}
            </h3>
          </Link>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-black text-slate-900">
                {format(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {format(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {product.stock > 0 ? (
            <button
              onClick={() => addToCart(product)}
              className={`p-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 shadow-sm ${
                inCart
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-[#242b27] hover:bg-black text-white'
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#eb9800]" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </button>
          ) : (
            <Link
              to={`/product/${prodId}`}
              className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 rounded-xl font-extrabold text-[11px] transition shadow-xs flex items-center space-x-1"
            >
              <span>Notify Me</span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};
