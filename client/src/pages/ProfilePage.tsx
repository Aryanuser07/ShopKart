import React, { useEffect, useState } from 'react';
import { User, Package, Clock, Shield, LogOut, CheckCircle2, Truck, ExternalLink, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Order } from '../types';
import { useCurrency } from '../utils/formatCurrency';
import { InView } from '../components/core/in-view';
import { motion } from 'framer-motion';

const variantStyles: Record<string, { border: string; base: string; overlay: string; accent: string; text: string; glow: string }> = {
  emerald: {
    border: "from-emerald-400 via-emerald-300 to-emerald-200",
    base: "from-emerald-50 via-emerald-50/80 to-emerald-50/90",
    overlay: "from-emerald-300/30 via-emerald-200/20 to-emerald-400/20",
    accent: "from-emerald-400/20 via-emerald-300/10 to-emerald-200/30",
    text: "from-emerald-800 to-emerald-700",
    glow: "rgba(52,211,153,0.2)"
  },
  purple: {
    border: "from-purple-400 via-purple-300 to-purple-200",
    base: "from-purple-50 via-purple-50/80 to-purple-50/90",
    overlay: "from-purple-300/30 via-purple-200/20 to-purple-400/20",
    accent: "from-purple-400/20 via-purple-300/10 to-purple-200/30",
    text: "from-purple-800 to-purple-700",
    glow: "rgba(159,122,234,0.2)"
  },
  orange: {
    border: "from-amber-400 via-amber-300 to-amber-200",
    base: "from-amber-50 via-amber-50/80 to-amber-50/90",
    overlay: "from-amber-300/30 via-amber-200/20 to-amber-400/20",
    accent: "from-amber-400/20 via-amber-300/10 to-amber-200/30",
    text: "from-amber-800 to-amber-700",
    glow: "rgba(245,158,11,0.2)"
  },
  cyan: {
    border: "from-cyan-400 via-cyan-300 to-cyan-200",
    base: "from-cyan-50 via-cyan-50/80 to-cyan-50/90",
    overlay: "from-cyan-300/30 via-cyan-200/20 to-cyan-400/20",
    accent: "from-cyan-400/20 via-cyan-300/10 to-cyan-200/30",
    text: "from-cyan-800 to-cyan-700",
    glow: "rgba(6,182,212,0.2)"
  },
  rose: {
    border: "from-rose-400 via-rose-300 to-rose-200",
    base: "from-rose-50 via-rose-50/80 to-rose-50/90",
    overlay: "from-rose-300/30 via-rose-200/20 to-rose-400/20",
    accent: "from-rose-400/20 via-rose-300/10 to-rose-200/30",
    text: "from-rose-800 to-rose-700",
    glow: "rgba(244,63,94,0.2)"
  }
};

const KokonutBadge: React.FC<{ label: string; variant?: 'emerald' | 'purple' | 'orange' | 'cyan' | 'rose' }> = ({ label, variant = 'emerald' }) => {
  const v = variantStyles[variant] || variantStyles.emerald;
  return (
    <div className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-3 py-1 text-xs transition-all duration-300 shadow-2xs hover:shadow-xs">
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r p-[1.5px] ${v.border}`}>
        <div className="absolute inset-0 rounded-full bg-white/90" />
      </div>
      <div className={`absolute inset-[1.5px] rounded-full bg-gradient-to-r ${v.base}`} />
      <div className={`absolute inset-[1.5px] rounded-full bg-gradient-to-b ${v.overlay}`} />
      <div className={`absolute inset-[1.5px] rounded-full bg-gradient-to-br ${v.accent}`} />
      <div className="absolute inset-[1.5px] rounded-full" style={{ boxShadow: `inset 0 0 8px ${v.glow}` }} />
      <span className={`relative z-10 font-extrabold bg-gradient-to-r bg-clip-text text-transparent ${v.text}`}>
        {label}
      </span>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { format } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleUserCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
    } catch (e) {
      // Fallback
    }

    try {
      const localOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
      const targetId = String(orderId).toLowerCase();
      localOrders.forEach((o: any) => {
        const oId = String(o._id || o.id || '').toLowerCase();
        if (oId === targetId || oId.endsWith(targetId) || targetId.endsWith(oId)) {
          o.orderStatus = 'Cancelled';
          o.fulfillmentStatus = 'Cancelled';
        }
      });
      localStorage.setItem('shopkart-custom-orders', JSON.stringify(localOrders));
    } catch (e) {
      // Silent
    }

    const ordersChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('shopkart_orders_sync_channel') : null;
    ordersChannel?.postMessage({ type: 'order_status_updated' });
    window.dispatchEvent(new Event('shopkart-orders-updated'));
  };

  useEffect(() => {
    const ordersChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('shopkart_orders_sync_channel') : null;

    const fetchOrders = async () => {
      let serverOrders: Order[] = [];

      try {
        const myRes = await api.get('/orders/my-orders');
        if (myRes.data.orders && Array.isArray(myRes.data.orders)) {
          serverOrders = myRes.data.orders;
        }
      } catch (err) {
        // Fallback
      }

      // Filter orders belonging to the logged in user
      const userEmail = (user?.email || '').trim().toLowerCase();
      const userId = String(user?.id || (user as any)?._id || '').trim().toLowerCase();

      let localRaw: any[] = [];
      try {
        localRaw = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
      } catch (e) {
        localRaw = [];
      }

      const combined = [...serverOrders, ...localRaw];
      const seen = new Set<string>();
      const userOrders: Order[] = [];

      combined.forEach((o: any) => {
        const idStr = String(o._id || o.id || o.orderId || '').toLowerCase();
        if (!idStr || seen.has(idStr)) return;

        const oEmail = (o.user?.email || o.shippingAddress?.email || o.customerEmail || o.email || '').trim().toLowerCase();
        const oUserId = typeof o.user === 'object' && o.user !== null
          ? String(o.user.id || o.user._id || '').trim().toLowerCase()
          : String(o.user || '').trim().toLowerCase();

        const isUserOrder =
          (userEmail && oEmail && (userEmail === oEmail || oEmail.startsWith(userEmail.split('@')[0]) || userEmail.startsWith(oEmail.split('@')[0]))) ||
          (userId && oUserId && (userId === oUserId || userId.includes(oUserId) || oUserId.includes(userId)));

        if (isUserOrder) {
          seen.add(idStr);

          // Find server version if available to get latest admin-updated status
          const serverMatch = serverOrders.find(s => {
            const sId = String(s._id || s.id || (s as any).orderId || '').toLowerCase();
            return sId === idStr || sId.endsWith(idStr) || idStr.endsWith(sId) || sId.includes(idStr) || idStr.includes(sId);
          });

          const finalOrder = serverMatch
            ? {
                ...o,
                ...serverMatch,
                orderStatus: serverMatch.orderStatus || (serverMatch as any).fulfillmentStatus || o.orderStatus,
                fulfillmentStatus: (serverMatch as any).fulfillmentStatus || serverMatch.orderStatus || o.fulfillmentStatus
              }
            : o;
          userOrders.push(finalOrder);
        }
      });

      userOrders.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.paidAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.paidAt || 0).getTime();
        return timeB - timeA;
      });

      setOrders(userOrders);
      setLoading(false);
    };

    if (user) {
      fetchOrders();
      const handleUpdate = () => fetchOrders();
      if (ordersChannel) {
        ordersChannel.onmessage = handleUpdate;
      }
      window.addEventListener('shopkart-orders-updated', handleUpdate);
      window.addEventListener('focus', handleUpdate);

      return () => {
        window.removeEventListener('shopkart-orders-updated', handleUpdate);
        window.removeEventListener('focus', handleUpdate);
      };
    }
  }, [user]);

  if (!user) {
    return (
      <InView className="max-w-md mx-auto px-4 py-16 text-center space-y-4 bg-[#faf9f6]">
        <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-[#eb9800]">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#242b27]">Sign In Required</h2>
        <p className="text-xs text-slate-500">Please sign in to view your profile, order history, and saved preferences.</p>
      </InView>
    );
  }

  return (
    <InView className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#faf9f6]">
      
      {/* Profile Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-[#eb9800] text-slate-950 flex items-center justify-center text-3xl font-black shadow-md shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-[#242b27]">{user.name}</h1>
              {user.role === 'admin' && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-amber-600" />
                  <span>Executive Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">{user.email}</p>
            <p className="text-[11px] text-[#242b27]/40 mt-0.5 font-bold">Account ID: {user.id || (user as any)._id}</p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="btn-animated-fill btn-animated-outline px-5 py-2.5 text-red-600 border border-red-200 font-bold text-xs rounded-xl flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Account</span>
        </button>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h2 className="text-xl font-extrabold text-[#242b27]">Order History</h2>
          <span className="text-xs text-slate-500 font-medium">{orders.length} Completed Transactions</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-4 shadow-xs">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-[#242b27]">No Orders Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When you purchase products from ShopKart, your live tracking details and order receipts will appear here.
            </p>
            <Link
              to="/products"
              className="btn-animated-fill btn-animated-gold inline-block px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <InView
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
              }}
              className="space-y-4"
            >
              {orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(order => {
                const orderId = order._id || order.id;
                const rawSt = (order as any).fulfillmentStatus || order.orderStatus || (order.isPaid ? 'Processing' : 'Order Placed');
                const statusText = rawSt === 'Pending' ? (order.isPaid ? 'Processing' : 'Order Placed') : rawSt;
                const itemsList = order.orderItems || [];
                const isRefunded = statusText === 'Refunded';

                const statusVariant = statusText === 'Delivered'
                  ? 'emerald'
                  : statusText === 'Refunded'
                  ? 'purple'
                  : statusText === 'Shipped' || statusText === 'Out for Delivery'
                  ? 'cyan'
                  : statusText === 'Cancelled'
                  ? 'rose'
                  : 'orange';

                const paymentVariant = isRefunded
                  ? 'purple'
                  : order.isPaid
                  ? 'emerald'
                  : 'orange';

                const paymentLabel = isRefunded
                  ? `Refunded • ${order.paymentMethod || 'Stripe'}`
                  : `${order.isPaid ? 'Paid' : 'Pending'} • ${order.paymentMethod || 'Stripe'}`;

                return (
                  <motion.div
                    key={orderId}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs hover:border-amber-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-[#242b27]">Order #{orderId.slice(-8).toUpperCase()}</span>
                          <KokonutBadge label={statusText} variant={statusVariant} />
                          <KokonutBadge label={paymentLabel} variant={paymentVariant} />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-lg font-black text-[#eb9800] mr-1">
                          {format(order.totalPrice)}
                        </span>

                        {(statusText === 'Order Placed' || statusText === 'Processing' || statusText === 'Pending') && (
                          <button
                            onClick={() => handleUserCancelOrder(orderId)}
                            className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100 hover:border-red-300 text-xs font-extrabold transition flex items-center space-x-1 shrink-0"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel Order</span>
                          </button>
                        )}

                        <Link
                          to={`/order-tracking/${orderId}`}
                          className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all duration-300 shadow-2xs hover:shadow-xs shrink-0"
                        >
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r p-[1.5px] from-amber-400 via-amber-300 to-amber-200">
                            <div className="absolute inset-0 rounded-xl bg-white/95" />
                          </div>
                          <div className="absolute inset-[1.5px] rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-50/90" />
                          <div className="absolute inset-[1.5px] rounded-xl bg-gradient-to-b from-amber-300/30 via-amber-200/20 to-amber-400/20" />
                          <div className="absolute inset-[1.5px] rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-300/10 to-amber-200/30" />
                          <div className="absolute inset-[1.5px] rounded-xl" style={{ boxShadow: 'inset 0 0 8px rgba(245,158,11,0.2)' }} />
                          <div className="relative z-10 flex items-center space-x-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#eb9800]" />
                            <span className="bg-gradient-to-r from-amber-900 to-amber-800 bg-clip-text text-transparent font-black">
                              Track Live
                            </span>
                            <ExternalLink className="w-3 h-3 text-amber-700 ml-0.5" />
                          </div>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {itemsList.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-3 p-2 bg-[#faf9f6] rounded-xl border border-slate-100">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#242b27] truncate">{item.title}</p>
                            <p className="text-[11px] text-slate-500 font-medium">Qty: {item.quantity} × {format(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </InView>

            {/* Profile Orders Pagination Footer */}
            {orders.length > itemsPerPage && (
              <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium">
                  Showing <span className="font-bold text-[#242b27]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-[#242b27]">{Math.min(currentPage * itemsPerPage, orders.length)}</span> of{' '}
                  <span className="font-bold text-[#242b27]">{orders.length}</span> orders
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition shadow-2xs"
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.ceil(orders.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition ${
                        currentPage === page
                          ? 'bg-[#eb9800] text-slate-950 shadow-xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(orders.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition shadow-2xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </InView>
  );
};

export default ProfilePage;
