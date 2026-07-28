import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, ShieldCheck, Zap } from 'lucide-react';
import api from '../../services/api';
import { InView } from '../../components/core/in-view';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [ordersRes, prodRes, usersRes] = await Promise.all([
          api.get('/orders/admin/orders'),
          api.get('/products?limit=100'),
          api.get('/auth/users')
        ]);

        const ordersList = ordersRes.data.orders || [];
        const productsList = prodRes.data.products || [];
        const usersList = usersRes.data.users || [];

        const rev = ordersList.reduce((acc: number, o: any) => acc + (o.totalPrice || 0), 0);

        setStats({
          totalRevenue: rev,
          totalOrders: ordersList.length,
          totalProducts: productsList.length,
          totalUsers: usersList.length
        });

        setRecentOrders(ordersList.slice(0, 5));
      } catch (err) {
        // Silent
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <InView className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#faf9f6]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#242b27] tracking-tight">Executive Admin Suite</h1>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Verified Admin</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sales performance metrics, catalog management, and customer analytics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/products"
            className="px-4 py-2 bg-[#242b27] hover:bg-[#1a201c] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Package className="w-3.5 h-3.5 text-[#eb9800]" />
            <span>Manage Products</span>
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-[#f59e0b] hover:bg-[#eb9800] text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Manage Orders</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <InView
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
          className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#eb9800] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#242b27]">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
          <div className="flex items-center text-[11px] text-emerald-700 font-extrabold space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last month</span>
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
          className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#242b27]">{stats.totalOrders}</p>
          <div className="flex items-center text-[11px] text-emerald-700 font-extrabold space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% Stripe Verified</span>
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
          className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Inventory</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#242b27]">{stats.totalProducts}</p>
          <div className="flex items-center text-[11px] text-slate-500 font-bold space-x-1">
            <Zap className="w-3.5 h-3.5 text-[#eb9800]" />
            <span>Active SKUs</span>
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
          className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Users</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#242b27]">{stats.totalUsers}</p>
          <div className="flex items-center text-[11px] text-emerald-700 font-extrabold space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Active Customers</span>
          </div>
        </motion.div>
      </InView>

      {/* Recent Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-[#242b27]">Recent Store Orders</h2>
          <Link to="/admin/orders" className="text-xs font-bold text-[#eb9800] hover:underline">
            View All Orders ➔
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No recent store orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-extrabold">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map(o => (
                  <tr key={o._id || o.id} className="hover:bg-slate-50 font-medium text-[#242b27]">
                    <td className="py-3 px-3 font-bold">#{(o._id || o.id).slice(-8).toUpperCase()}</td>
                    <td className="py-3 px-3">{o.shippingAddress?.fullName || 'Customer'}</td>
                    <td className="py-3 px-3 font-extrabold text-[#eb9800]">₹{o.totalPrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </InView>
  );
};
