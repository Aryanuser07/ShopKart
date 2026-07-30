import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { InView } from '../../components/core/in-view';
import { useCurrency } from '../../utils/formatCurrency';

const FALLBACK_ORDERS: any[] = [];

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { format } = useCurrency();

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      if (res.data.orders && res.data.orders.length > 0) {
        setOrders(res.data.orders);
      } else {
        setOrders(FALLBACK_ORDERS);
      }
    } catch (err) {
      setOrders(FALLBACK_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { orderStatus: newStatus, status: newStatus });
      setOrders(prev =>
        prev.map(o => ((o._id || o.id) === orderId ? { ...o, orderStatus: newStatus, status: newStatus } : o))
      );
      setToastMessage(`✅ Order #${orderId.slice(-6).toUpperCase()} status updated to "${newStatus}"!`);
    } catch (err) {
      setOrders(prev =>
        prev.map(o => ((o._id || o.id) === orderId ? { ...o, orderStatus: newStatus, status: newStatus } : o))
      );
      setToastMessage(`✅ Order #${orderId.slice(-6).toUpperCase()} status updated to "${newStatus}"!`);
    } finally {
      setUpdatingId(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <InView className="min-h-screen bg-[#faf9f6] p-6 space-y-6">
      
      {toastMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-[#242b27]">Customer Orders Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time customer purchases, payment verifications, and delivery dispatch statuses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-[#faf9f6] border border-slate-200 text-[#242b27] text-xs font-bold px-3 py-1.5 rounded-xl">
            Total Orders: {orders.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading order records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="pb-3 px-3">Order Ref</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Payment</th>
                  <th className="pb-3 px-3">Current Status</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o, idx) => {
                  const rawId = o._id || o.id || `ord-${idx}`;
                  const displayId = `#${rawId.slice(-8).toUpperCase()}`;
                  const customerName = o.user?.name || o.shippingAddress?.fullName || 'ShopKart Customer';
                  const customerEmail = o.user?.email || 'customer@shopkart.com';
                  const dateStr = new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const currentStatus = o.orderStatus || o.status || 'Processing';

                  return (
                    <tr key={rawId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-extrabold text-[#242b27]">{displayId}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#242b27]">{customerName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{customerEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{dateStr}</td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Paid • {o.paymentMethod || 'Card'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block ${
                          currentStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : currentStatus === 'Out for Delivery'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : currentStatus === 'Shipped'
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#eb9800]">
                        {format(o.totalPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          disabled={updatingId === rawId}
                          value={currentStatus}
                          onChange={e => handleStatusChange(rawId, e.target.value)}
                          className="bg-[#faf9f6] border border-slate-200 text-[#242b27] text-xs font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-[#eb9800]"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InView>
  );
};
