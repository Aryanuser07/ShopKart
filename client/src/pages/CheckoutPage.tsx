import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, CreditCard, Truck, CheckCircle2, Lock, ArrowRight, AlertCircle, Bell } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../utils/formatCurrency';
import { getCustomProducts, deductCustomProductStock } from '../utils/productStorage';
import api from '../services/api';

export const CheckoutPage: React.FC = () => {
  const { cartItems, subtotal, discountAmount, shippingPrice, taxPrice, totalPrice, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [street, setStreet] = useState(user?.addresses?.[0]?.street || '42 MG Road, Indiranagar');
  const [city, setCity] = useState(user?.addresses?.[0]?.city || 'Bengaluru');
  const [state, setState] = useState(user?.addresses?.[0]?.state || 'Karnataka');
  const [postalCode, setPostalCode] = useState(user?.addresses?.[0]?.postalCode || '560038');
  const [country] = useState('India');
  const [phone, setPhone] = useState(user?.phone || '+91 98123 45678');
  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'COD'>('Stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveCartItems, setLiveCartItems] = useState(cartItems);

  // Sync cart items with fresh product stock from localStorage / API
  useEffect(() => {
    const syncStock = () => {
      const customProds = getCustomProducts();
      const synced = cartItems.map(item => {
        const pId = String(item.product._id || item.product.id || '').toLowerCase();
        const pTitle = (item.product.title || '').trim().toLowerCase();
        const match = customProds.find(
          p => String(p._id || p.id || '').toLowerCase() === pId || (p.title && p.title.trim().toLowerCase() === pTitle)
        );

        if (match && typeof match.stock === 'number') {
          return { ...item, product: { ...item.product, stock: match.stock } };
        }
        return item;
      });
      setLiveCartItems(synced);
    };

    syncStock();
    window.addEventListener('shopkart-products-updated', syncStock);
    return () => window.removeEventListener('shopkart-products-updated', syncStock);
  }, [cartItems]);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const hasOutOfStockItem = liveCartItems.some(item => (item.product.stock ?? 0) <= 0 || item.quantity > (item.product.stock ?? 0));

  if (!user || cartItems.length === 0) {
    navigate('/', { replace: true });
    return null;
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderItems = cartItems.map(item => ({
        product: item.product._id || item.product.id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.images[0],
        quantity: item.quantity
      }));

      const shippingAddress = { street, city, state, postalCode, country };

      // Create Order API
      const res = await api.post('/orders', {
        orderItems,
        shippingAddress,
        paymentMethod: paymentMethod === 'Stripe' ? 'Stripe' : 'COD',
        customerUser: {
          id: user?.id || (user as any)?._id,
          name: user?.name,
          email: user?.email
        }
      });

      // Deduct stock in local custom storage immediately
      deductCustomProductStock(cartItems);

      const createdOrder = res.data.order;
      createdOrder.orderStatus = paymentMethod === 'Stripe' ? 'Processing' : 'Order Placed';
      createdOrder.isPaid = paymentMethod === 'Stripe' || createdOrder.isPaid;
      const addrAny = shippingAddress as any;
      createdOrder.user = {
        id: user?.id || (user as any)?._id || createdOrder.user?.id || createdOrder.user,
        _id: user?.id || (user as any)?._id || createdOrder.user?._id || createdOrder.user,
        name: user?.name || addrAny.fullName || 'ShopKart Customer',
        email: user?.email || addrAny.email || ''
      };
      createdOrder.shippingAddress = {
        ...shippingAddress,
        fullName: user?.name || addrAny.fullName || 'ShopKart Customer',
        email: user?.email || addrAny.email || ''
      };
      createdOrder.customerName = user?.name || addrAny.fullName || 'ShopKart Customer';
      createdOrder.customerEmail = user?.email || addrAny.email || '';

      const orderId = createdOrder._id || createdOrder.id;

      try {
        const localOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
        localOrders.unshift(createdOrder);
        localStorage.setItem('shopkart-custom-orders', JSON.stringify(localOrders));
        window.dispatchEvent(new Event('shopkart-orders-updated'));

        // Sync order to backend memoryStore for cross-session/admin visibility
        api.post('/orders/sync', { order: createdOrder }).catch(() => {});

        // Deduct local product stock in localStorage
        const customProds = JSON.parse(localStorage.getItem('shopkart-custom-products') || '[]');
        let updated = false;
        orderItems.forEach((item: any) => {
          const pId = String(item.product || '');
          const pTitle = (item.title || '').toLowerCase();
          const qty = Number(item.quantity) || 1;

          customProds.forEach((p: any) => {
            if (p._id === pId || p.id === pId || (p.title && p.title.toLowerCase().includes(pTitle))) {
              p.stock = Math.max(0, (p.stock || 50) - qty);
              updated = true;
            }
          });
        });
        if (updated) {
          localStorage.setItem('shopkart-custom-products', JSON.stringify(customProds));
          window.dispatchEvent(new Event('shopkart-products-updated'));
        }
      } catch (e) {
        // Silent
      }

      if (paymentMethod === 'Stripe') {
        // Trigger Checkout Session
        const stripeRes = await api.post('/orders/create-checkout-session', { orderId });
        clearCart();
        if (stripeRes.data.testMode) {
          navigate(`/order-success/${orderId}`);
        } else if (stripeRes.data.checkoutUrl) {
          window.location.href = stripeRes.data.checkoutUrl;
        }
      } else {
        clearCart();
        navigate(`/order-success/${orderId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#faf9f6]">
      
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-extrabold text-[#242b27] tracking-tight">Secure Express Checkout</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          256-bit encrypted checkout powered by Stripe
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-2xl text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Shipping & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Shipping Address Box */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-3">
              <Truck className="w-5 h-5 text-[#eb9800]" />
              <h3 className="text-sm font-bold text-[#242b27] uppercase tracking-wider">1. Shipping Address</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#242b27] font-bold focus:outline-none focus:border-[#eb9800]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#242b27] font-bold focus:outline-none focus:border-[#eb9800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#242b27] font-bold focus:outline-none focus:border-[#eb9800]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN / Postal Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#242b27] font-bold focus:outline-none focus:border-[#eb9800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#242b27] font-bold focus:outline-none focus:border-[#eb9800]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-3">
              <CreditCard className="w-5 h-5 text-[#eb9800]" />
              <h3 className="text-sm font-bold text-[#242b27] uppercase tracking-wider">2. Payment Method</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                  paymentMethod === 'Stripe'
                    ? 'bg-amber-50 border-amber-400 text-[#242b27] shadow-xs'
                    : 'bg-[#faf9f6] border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="Stripe"
                  checked={paymentMethod === 'Stripe'}
                  onChange={() => setPaymentMethod('Stripe')}
                  className="mt-1 accent-[#eb9800]"
                />
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-[#242b27]">
                    <Shield className="w-4 h-4 text-[#eb9800]" />
                    <span>Stripe Express (Cards & NetBanking)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Instant payment verification in Test Sandbox mode</p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                  paymentMethod === 'COD'
                    ? 'bg-amber-50 border-amber-400 text-[#242b27] shadow-xs'
                    : 'bg-[#faf9f6] border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 accent-[#eb9800]"
                />
                <div>
                  <div className="font-bold text-xs text-[#242b27]">Cash on Delivery (COD)</div>
                  <p className="text-[11px] text-slate-500 mt-1">Pay with cash upon package delivery</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 sticky top-20 shadow-xs">
            <h3 className="text-base font-extrabold text-[#242b27] border-b border-slate-200/80 pb-3">
              Order Review ({cartItems.length} items)
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {liveCartItems.map(({ product, quantity }) => {
                const prodId = product._id || product.id;
                const isOut = (product.stock ?? 0) <= 0;
                const isExceeded = quantity > (product.stock ?? 0);

                return (
                  <div key={prodId} className={`p-2.5 rounded-xl border transition ${isOut || isExceeded ? 'bg-rose-50/70 border-rose-200' : 'border-slate-100'}`}>
                    <div className="flex items-center space-x-3">
                      <img src={product.images[0]} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#242b27] truncate">{product.title}</h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                          <span>Qty: {quantity}</span>
                          {isOut ? (
                            <span className="text-rose-700 font-extrabold flex items-center space-x-1 bg-rose-100 px-2 py-0.5 rounded-md">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>0 Units Available</span>
                            </span>
                          ) : isExceeded ? (
                            <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                              Only {product.stock} left in stock!
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">{product.stock} available</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#242b27] block">{format(product.price * quantity)}</span>
                        {isExceeded && !isOut && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(prodId, product.stock ?? 1)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline mt-0.5"
                          >
                            Adjust Qty to {product.stock}
                          </button>
                        )}
                        {isOut && (
                          <Link
                            to={`/product/${prodId}`}
                            className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded hover:bg-amber-300 transition inline-flex items-center space-x-1 mt-0.5"
                          >
                            <Bell className="w-2.5 h-2.5" />
                            <span>Notify Me</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-4 border-t border-slate-200/80">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-[#242b27]">{format(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount</span>
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
                <span>Total Amount</span>
                <span className="text-[#eb9800]">{format(totalPrice)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || hasOutOfStockItem}
              className="w-full py-4 bg-[#f59e0b] hover:bg-[#eb9800] text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {loading
                  ? 'Processing Order...'
                  : hasOutOfStockItem
                  ? 'Adjust Cart Quantity to Proceed'
                  : `Pay ${format(totalPrice)} Now`}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
