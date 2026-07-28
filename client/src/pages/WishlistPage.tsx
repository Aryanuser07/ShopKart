import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { InView } from '../components/core/in-view';
import { motion } from 'framer-motion';
import { mergeProductsWithCustom } from '../utils/productStorage';

export const WishlistPage: React.FC = () => {
  const { wishlistIds, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistIds.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get('/products?limit=100');
        const all: Product[] = mergeProductsWithCustom(res.data.products || []);
        const filtered = all.filter(p => wishlistIds.includes(p._id || p.id));
        setWishlistProducts(filtered);
      } catch (err) {
        const all: Product[] = mergeProductsWithCustom([]);
        const filtered = all.filter(p => wishlistIds.includes(p._id || p.id));
        setWishlistProducts(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistIds]);

  const handleAddAllToCart = () => {
    wishlistProducts.forEach(p => addToCart(p, 1));
  };

  if (wishlistIds.length === 0) {
    return (
      <InView className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 bg-[#faf9f6]">
        <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-[#eb9800] shadow-sm">
          <Heart className="w-10 h-10 fill-[#eb9800]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#242b27]">Your Wishlist is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Save your favorite sneakers, wireless headphones, and tech gadgets to your wishlist to buy later.
        </p>
        <Link
          to="/products"
          className="btn-animated-fill btn-animated-gold inline-flex items-center space-x-2 px-6 py-3 font-bold text-xs rounded-xl shadow-xs"
        >
          <span>Discover Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </InView>
    );
  }

  return (
    <InView className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#faf9f6]">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#242b27] tracking-tight">Saved Wishlist</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {wishlistProducts.length} items saved in your personal collection
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleAddAllToCart}
            className="btn-animated-fill btn-animated-dark px-4 py-2 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#eb9800]" />
            <span>Add All to Cart</span>
          </button>
          
          <button
            onClick={clearWishlist}
            className="btn-animated-fill btn-animated-outline px-3 py-2 text-xs font-bold text-red-600 rounded-xl border border-red-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 bg-slate-200/60 rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <InView
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {wishlistProducts.map(product => (
            <motion.div
              key={product.id || product._id}
              variants={{
                hidden: { opacity: 0, scale: 0.9, filter: 'blur(8px)' },
                visible: { opacity: 1, scale: 1, filter: 'blur(0px)' }
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </InView>
      )}

    </InView>
  );
};

export default WishlistPage;
