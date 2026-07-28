import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-animated-bg border-t border-slate-200/80 text-[#242b27] pt-12 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#eb9800] flex items-center justify-center text-slate-950 font-black">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#242b27]">
                Shop<span className="text-[#eb9800]">Kart</span>
              </span>
            </Link>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm font-medium">
              Architected with Node.js, Express, MongoDB, Stripe, and Kokonut UI. Empowering modern e-commerce with agentic recommendations and 3D preview engines.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#eb9800]">Shop</h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><Link to="/products" className="hover:text-[#eb9800] transition">All Products</Link></li>
              <li><Link to="/products?category=Electronics" className="hover:text-[#eb9800] transition">Electronics</Link></li>
              <li><Link to="/products?category=Fashion%20%26%20Footwear" className="hover:text-[#eb9800] transition">Fashion</Link></li>
              <li><Link to="/wishlist" className="hover:text-[#eb9800] transition">Wishlist</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#eb9800]">Account</h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><Link to="/profile" className="hover:text-[#eb9800] transition">My Profile</Link></li>
              <li><Link to="/profile" className="hover:text-[#eb9800] transition">Order Tracking</Link></li>
              <li><Link to="/cart" className="hover:text-[#eb9800] transition">Shopping Cart</Link></li>
              <li><Link to="/admin" className="hover:text-[#eb9800] transition">Admin Suite</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#eb9800]">Newsletter</h4>
            <p className="text-xs text-slate-600 font-medium">Get product releases and exclusive promo codes.</p>
            <form onSubmit={e => e.preventDefault()} className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Enter email address"
                className="px-3.5 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs text-[#242b27] placeholder-slate-400 focus:outline-none focus:border-[#eb9800] flex-1 shadow-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#f59e0b] hover:bg-[#eb9800] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} ShopKart Agentic E-Commerce Platform. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
