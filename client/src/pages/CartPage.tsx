import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Tag, CheckCircle, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../utils/formatCurrency';
import { InView } from '../components/core/in-view';

export const CartPage: React.FC = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    discountAmount,
    shippingPrice,
    taxPrice,
    totalPrice,
    couponCode,
    applyCoupon
  } = useCart();

  const { format } = useCurrency();
  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const navigate = useNavigate();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!inputCoupon.trim()) return;

    const success = applyCoupon(inputCoupon);
    if (!success) {
      setCouponError('Invalid coupon. Try SHOPKART10 or BIGSAVE20');
    }
  };

  if (cartItems.length === 0) {
    return (
      <InView className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 bg-[#faf9f6]">
        <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-[#eb9800]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#242b27]">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our trending audio gear, sneakers, and gaming accessories to add items to your cart.
        </p>
        <Link
          to="/products"
          className="btn-animated-fill btn-animated-gold inline-flex items-center space-x-2 px-6 py-3 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
        >
          <span>Explore Product Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </InView>
    );
  }

  return (
    <InView className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#faf9f6]">
      
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#242b27] tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review items, apply discount coupons, and proceed to checkout
          </p>
        </div>
        <Link to="/products" className="text-xs font-bold text-[#eb9800] hover:underline flex items-center space-x-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map(({ product, quantity }) => {
            const prodId = product._id || product.id;
            return (
              <div
                key={prodId}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold text-[#eb9800] uppercase tracking-wider">{product.category}</span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#242b27] max-w-md line-clamp-1">{product.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>
                    <span className="text-xs font-extrabold text-[#242b27] sm:hidden mt-1 block">
                      {format(product.price * quantity)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="flex items-center space-x-2 bg-[#faf9f6] border border-slate-200 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(product, quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-[#242b27] px-2">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product, quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-sm font-extrabold text-[#242b27]">
                      {format(product.price * quantity)}
                    </span>
                    <p className="text-[10px] text-slate-500">{format(product.price)} each</p>
                  </div>

                  <button
                    onClick={() => removeFromCart(product)}
                    className="p-2 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 sticky top-20 shadow-xs">
            <h3 className="text-base font-extrabold text-[#242b27] border-b border-slate-200/80 pb-3">
              Order Summary
            </h3>

            {/* Coupon Box */}
            <form onSubmit={handleApplyCoupon} className="space-y-1">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={inputCoupon}
                    onChange={e => setInputCoupon(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#242b27] font-bold uppercase focus:outline-none focus:border-[#eb9800]"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-animated-fill btn-animated-outline text-xs font-bold px-4 py-2 rounded-xl text-[#242b27] border border-slate-200 cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {couponCode && (
                <div className="flex items-center space-x-1 text-xs text-emerald-700 font-semibold pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Coupon <strong>{couponCode}</strong> applied</span>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-600 pt-1">{couponError}</p>
              )}
            </form>

            {/* Cost Table */}
            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-[#242b27]">{format(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Savings</span>
                  <span>- {format(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium">
                <span>Shipping</span>
                <span>{shippingPrice === 0 ? <strong className="text-emerald-700 font-bold">FREE</strong> : format(shippingPrice)}</span>
              </div>

              <div className="flex justify-between font-medium">
                <span>GST Tax (18%)</span>
                <span className="font-bold text-[#242b27]">{format(taxPrice)}</span>
              </div>

              <div className="flex justify-between text-base font-black text-[#242b27] pt-3 border-t border-slate-200/80">
                <span>Total Payable</span>
                <span className="text-[#eb9800]">{format(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn-animated-fill btn-animated-gold w-full py-3.5 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </InView>
  );
};

export default CartPage;
