import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User as UserIcon, Sparkles, Shield, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../utils/formatCurrency';
import { AgenticAssistantModal } from './AgenticAssistantModal';
import ActionSearchBar from './ActionSearchBar';
import Text3DFlip from './Text3DFlip';
import ShimmerText from './ShimmerText';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartItems, isCartOpen, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { currency, setCurrency } = useCurrency();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const totalItems = cartItems.reduce((acc: number, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Centered Floating Pill Header */}
      <header className="sticky top-0 z-40 p-3 sm:p-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between space-x-4 rounded-full border border-slate-200/80 bg-white/90 p-1.5 pl-4 pr-2 shadow-sm backdrop-blur-xl transition-all">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="w-8 h-8 rounded-full bg-[#eb9800] flex items-center justify-center shadow-xs text-slate-950 group-hover:scale-105 transition transform">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            
            <div className="flex items-center text-lg font-black tracking-tight">
              <Text3DFlip
                textClassName="text-[#242b27]"
                flipTextClassName="text-[#eb9800]"
                rotateDirection="top"
                staggerDuration={0.03}
                staggerFrom="first"
              >
                Shop
              </Text3DFlip>
              <Text3DFlip
                textClassName="text-[#eb9800]"
                flipTextClassName="text-[#242b27]"
                rotateDirection="top"
                staggerDuration={0.03}
                staggerFrom="first"
              >
                Kart
              </Text3DFlip>
            </div>
          </Link>

          {/* Action Search Bar (Centered Pill Input) */}
          <div className="hidden md:block flex-1 max-w-sm">
            <ActionSearchBar onOpenAssistant={() => setIsAssistantOpen(true)} />
          </div>

          {/* Navigation & Action Links */}
          <div className="hidden md:inline-flex items-center space-x-2">
            
            {/* Wishlist Button */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
              title="Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#eb9800] text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Currency Selector Pill */}
            <button
              onClick={() => {
                const nextCurrency = currency === 'INR' ? 'USD' : currency === 'USD' ? 'EUR' : 'INR';
                setCurrency(nextCurrency);
              }}
              className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center space-x-1"
              title="Click to toggle currency (INR / USD / EUR)"
            >
              <span>{currency === 'INR' ? '₹ INR' : currency === 'USD' ? '$ USD' : '€ EUR'}</span>
            </button>

            {/* User Account / Login Button */}
            {user ? (
              <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="bg-[#242b27] hover:bg-black text-white px-4 py-1.5 font-bold text-xs rounded-full shadow-2xs flex items-center space-x-1.5 overflow-hidden transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#eb9800]" />
                  <ShimmerText text={user.name ? user.name.split(' ')[0] : 'ShopKart'} className="text-xs font-black" />
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                    setIsAuthOpen(true);
                  }}
                  className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-[#242b27] hover:bg-black text-white px-4 py-1.5 font-black text-xs rounded-full shadow-2xs flex items-center space-x-1.5 overflow-hidden transition"
              >
                <LogIn className="w-3.5 h-3.5 text-[#eb9800]" />
                <ShimmerText text="ShopKart" className="text-xs font-black" />
              </button>
            )}

          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex p-2 rounded-full text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Open Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

        {/* Mobile Expanded Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 mx-auto max-w-6xl rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-xl space-y-3">
            <ActionSearchBar onOpenAssistant={() => setIsAssistantOpen(true)} />

            <div className="flex items-center justify-around pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
              <Link to="/products" className="py-1 hover:text-[#eb9800]">Products</Link>
              <Link to="/wishlist" className="py-1 hover:text-[#eb9800]">Wishlist ({wishlistIds.length})</Link>
              <button onClick={() => setIsCartOpen(true)} className="py-1 hover:text-[#eb9800]">Cart ({totalItems})</button>
              {user ? (
                <Link to="/profile" className="py-1 text-[#eb9800]">Profile</Link>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="py-1 text-[#eb9800]">Login</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Neural AI Assistant Drawer Modal */}
      <AgenticAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Split Screen Login / Signup Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
};

export default Navbar;
