import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../utils/formatCurrency';

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
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

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!inputCoupon.trim()) return;

    const success = applyCoupon(inputCoupon);
    if (!success) {
      setCouponError('Invalid coupon. Try SHOPKART10 or BIGSAVE20');
    }
  };

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#faf9f6] border-l border-slate-200/80 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200/80 bg-white">
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-5 h-5 text-[#eb9800]" />
              <h2 className="text-base font-extrabold text-[#242b27]">Your Shopping Cart</h2>
              <span className="bg-[#faf9f6] border border-slate-200 text-[#242b27] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-slate-400 hover:text-[#242b27] p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 text-[#eb9800] shadow-2xs">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-[#242b27] mb-1">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Explore our catalog of electronics, fashion, and accessories to add your favorites.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/products');
                  }}
                  className="bg-[#242b27] hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Start Browsing Catalog
                </button>
              </div>
            ) : (
              cartItems.map(({ product, quantity }) => {
                const prodId = product._id || product.id;
                return (
                  <div
                    key={prodId}
                    className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded-xl shrink-0 border border-slate-200/80 bg-slate-50"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#242b27] truncate">{product.title}</h4>
                      <p className="text-[11px] text-slate-400 mb-1">{product.brand || 'ShopKart'}</p>
                      <div className="text-xs font-black text-[#242b27]">
                        {format(product.price * quantity)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => removeFromCart(product)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center space-x-1 bg-[#faf9f6] border border-slate-200 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(product, quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#242b27] px-1.5">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product, quantity + 1)}
                          disabled={quantity >= (product.stock ?? 0)}
                          className={`w-6 h-6 flex items-center justify-center transition ${
                            quantity >= (product.stock ?? 0)
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-500 hover:text-slate-900 cursor-pointer'
                          }`}
                          title={quantity >= (product.stock ?? 0) ? `Maximum available stock reached (${product.stock})` : 'Increase quantity'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Order Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200/80 bg-white space-y-4 shadow-sm">
              
              {/* Coupon Box */}
              <form onSubmit={handleApplyCoupon} className="space-y-1">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Promo Coupon (e.g. SHOPKART10)"
                      value={inputCoupon}
                      onChange={e => setInputCoupon(e.target.value)}
                      className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#242b27] font-bold uppercase placeholder:normal-case placeholder-slate-400 focus:outline-none focus:border-[#eb9800]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#242b27] hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                {couponCode && (
                  <div className="flex items-center space-x-1 text-[11px] text-emerald-700 font-semibold pt-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Coupon <strong>{couponCode}</strong> applied ({discountAmount > 0 ? 'Discount Active' : ''})</span>
                  </div>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-600 pt-1">{couponError}</p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
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
                  <span>GST / Tax (18%)</span>
                  <span className="font-bold text-[#242b27]">{format(taxPrice)}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-[#242b27] pt-2.5 border-t border-slate-200/80">
                  <span>Total Amount</span>
                  <span className="text-[#eb9800]">{format(totalPrice)}</span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                onClick={handleProceedCheckout}
                className="btn-animated-fill btn-animated-gold w-full py-3 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Checkout Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
