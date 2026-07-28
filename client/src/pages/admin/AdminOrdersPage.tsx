import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import api from '../../services/api';
import { useCurrency } from '../../utils/formatCurrency';

Chart.register(...registerables);

interface OrderRow {
  rawId: string;
  orderId: string;
  customer: string;
  date: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  fulfillmentStatus: string;
  amount: number;
}

const SEEDED_ORDERS: OrderRow[] = [
  { rawId: 'ord-3921', orderId: '#3921', customer: 'Nandor the Relentless', date: 'Jun 12, 2025', paymentMethod: 'Stripe', paymentStatus: 'Paid', fulfillmentStatus: 'Delivered', amount: 16499 },
  { rawId: 'ord-3920', orderId: '#3920', customer: 'Laszlo Cravensworth', date: 'Jun 11, 2025', paymentMethod: 'Stripe', paymentStatus: 'Paid', fulfillmentStatus: 'Processing', amount: 9899 },
  { rawId: 'ord-3919', orderId: '#3919', customer: 'Nadja', date: 'Jun 10, 2025', paymentMethod: 'Stripe', paymentStatus: 'Paid', fulfillmentStatus: 'Delivered', amount: 25847 },
  { rawId: 'ord-3918', orderId: '#3918', customer: 'Guillermo de la Cruz', date: 'Jun 9, 2025', paymentMethod: 'COD', paymentStatus: 'Pending', fulfillmentStatus: 'Cancelled', amount: 3848 },
  { rawId: 'ord-3917', orderId: '#3917', customer: 'Colin Robinson', date: 'Jun 8, 2025', paymentMethod: 'Stripe', paymentStatus: 'Paid', fulfillmentStatus: 'Shipped', amount: 8999 },
  { rawId: 'ord-3916', orderId: '#3916', customer: 'The Guide', date: 'Jun 7, 2025', paymentMethod: 'Stripe', paymentStatus: 'Paid', fulfillmentStatus: 'Processing', amount: 4499 },
  { rawId: 'ord-3915', orderId: '#3915', customer: 'Aryan Sharma', date: 'Jun 6, 2025', paymentMethod: 'Stripe', paymentStatus: 'Paid', fulfillmentStatus: 'Delivered', amount: 14999 },
  { rawId: 'ord-3914', orderId: '#3914', customer: 'Priya Patel', date: 'Jun 5, 2025', paymentMethod: 'Stripe', paymentStatus: 'Paid', fulfillmentStatus: 'Delivered', amount: 8999 }
];

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

const KokonutSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  variant?: 'emerald' | 'purple' | 'orange' | 'cyan' | 'rose';
}> = ({ value, onChange, options, variant = 'emerald' }) => {
  const v = variantStyles[variant] || variantStyles.emerald;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative inline-flex items-center overflow-hidden rounded-full px-3 py-1 text-xs font-black transition-all duration-300 shadow-2xs hover:shadow-xs focus:outline-none"
      >
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r p-[1.5px] ${v.border}`}>
          <div className="absolute inset-0 rounded-full bg-white/95" />
        </div>
        <div className={`absolute inset-[1.5px] rounded-full bg-gradient-to-r ${v.base}`} />
        <div className={`absolute inset-[1.5px] rounded-full bg-gradient-to-b ${v.overlay}`} />
        <div className={`absolute inset-[1.5px] rounded-full bg-gradient-to-br ${v.accent}`} />
        <div className="absolute inset-[1.5px] rounded-full" style={{ boxShadow: `inset 0 0 8px ${v.glow}` }} />

        <span className={`relative z-10 font-extrabold bg-gradient-to-r bg-clip-text text-transparent ${v.text} mr-1.5`}>
          {currentLabel}
        </span>
        <ChevronDown className={`w-3 h-3 relative z-10 transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 z-50 mt-1.5 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-slate-950/5"
          >
            {options.map(opt => {
              const isSelected = opt.value === value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
                    isSelected ? 'bg-amber-50 text-[#eb9800]' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#eb9800] ml-2 shrink-0" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminOrdersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [orders, setOrders] = useState<OrderRow[]>(SEEDED_ORDERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { currency, format } = useCurrency();

  const comboChartRef = useRef<HTMLCanvasElement | null>(null);
  const comboChartInstance = useRef<Chart | null>(null);

  const handleExport = () => {
    const listToExport = orders && orders.length > 0 ? orders : SEEDED_ORDERS;
    let csv = `Order ID,Customer,Date,Payment Status,Fulfillment Status,Amount (${currency})\n`;
    listToExport.forEach(o => {
      csv += `"${o.orderId}","${o.customer}","${o.date}","${o.paymentStatus}","${o.fulfillmentStatus}","${format(o.amount)}"\n`;
    });

    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shopkart_orders_ledger_${currency.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`✅ ${listToExport.length} orders exported successfully as CSV in ${currency}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const handleHeaderAction = (e: any) => {
      if (e.detail?.actionType === 'export-orders') {
        handleExport();
      }
    };
    window.addEventListener('admin-header-action', handleHeaderAction);
    return () => window.removeEventListener('admin-header-action', handleHeaderAction);
  }, [orders]);

  const handleUpdateFulfillmentStatus = async (rawId: string, newStatus: string) => {
    // 1. Update local storage
    try {
      const localOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
      const targetId = rawId.toLowerCase();
      let updated = false;
      localOrders.forEach((o: any) => {
        const oId = String(o._id || o.id || o.orderId || '').toLowerCase();
        if (oId === targetId || targetId.endsWith(oId) || oId.endsWith(targetId)) {
          o.orderStatus = newStatus;
          o.fulfillmentStatus = newStatus;
          if (newStatus === 'Refunded') {
            o.paymentStatus = 'Refunded';
          }
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('shopkart-custom-orders', JSON.stringify(localOrders));
      }
    } catch (e) {
      // Silent
    }

    // 2. Update state directly
    setOrders(prev => prev.map(o => o.rawId === rawId ? {
      ...o,
      fulfillmentStatus: newStatus,
      paymentStatus: newStatus === 'Refunded' ? 'Refunded' : o.paymentStatus
    } : o));

    // 3. Update server API
    try {
      await api.put(`/admin/orders/${rawId}/status`, { orderStatus: newStatus });
    } catch (e) {
      // Offline fallback
    }

    // 4. Notify components across app
    window.dispatchEvent(new Event('shopkart-orders-updated'));
    ordersChannel?.postMessage({ type: 'order_status_updated', rawId, newStatus });
    setToastMessage(`⚡ Order ${rawId.slice(-8).toUpperCase()} fulfillment status updated to "${newStatus}"!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchOrders = async () => {
    let apiOrdersRaw: any[] = [];
    try {
      const res = await api.get('/admin/orders');
      if (res.data.orders && Array.isArray(res.data.orders)) {
        apiOrdersRaw = res.data.orders;
      }
    } catch (err) {
      // Offline / permission fallback
    }

    let allOrdersRaw: any[] = [];
    try {
      const allRes = await api.get('/orders/all-orders');
      if (allRes.data.orders && Array.isArray(allRes.data.orders)) {
        allOrdersRaw = allRes.data.orders;
      }
    } catch (err) {
      // Fallback
    }

    let userMyOrdersRaw: any[] = [];
    try {
      const myRes = await api.get('/orders/my-orders');
      if (myRes.data.orders && Array.isArray(myRes.data.orders)) {
        userMyOrdersRaw = myRes.data.orders;
      }
    } catch (err) {
      // Fallback
    }

    let localOrdersRaw: any[] = [];
    try {
      localOrdersRaw = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
      if (localOrdersRaw.length > 0) {
        api.post('/orders/sync', { orders: localOrdersRaw }).catch(() => {});
      }
    } catch (e) {
      localOrdersRaw = [];
    }

    const combinedRaw = [...localOrdersRaw, ...allOrdersRaw, ...apiOrdersRaw, ...userMyOrdersRaw, ...SEEDED_ORDERS];
    const seen = new Set<string>();
    const mergedList: OrderRow[] = [];

    combinedRaw.forEach((o: any) => {
      const rawId = (o._id || o.id || o.orderId || `ord-${Math.random()}`).toString();
      const idKey = rawId.toLowerCase();
      if (seen.has(idKey)) return;
      seen.add(idKey);

      const customerName = (typeof o.user === 'object' && o.user?.name)
        ? o.user.name
        : o.customerName || o.shippingAddress?.fullName || o.customer || (o.user?.email ? o.user.email.split('@')[0] : 'ShopKart Customer');

      const paymentMethod = o.paymentMethod || 'Stripe';
      const isPaid = o.isPaid ?? (paymentMethod === 'Stripe');
      let fulfillmentStatus = o.fulfillmentStatus || o.orderStatus || o.status || 'Processing';
      let paymentStatus: 'Paid' | 'Pending' | 'Refunded' = o.paymentStatus || (isPaid ? 'Paid' : 'Pending');

      if (fulfillmentStatus === 'Refunded') {
        paymentStatus = 'Refunded';
      } else if (fulfillmentStatus === 'Pending') {
        fulfillmentStatus = isPaid ? 'Processing' : 'Order Placed';
      }

      const cleanId = rawId.replace(/^ord-?/i, '').replace(/^#/, '');
      const displayOrderId = `#${cleanId.length > 8 ? cleanId.slice(-8).toUpperCase() : cleanId.toUpperCase()}`;

      const dateStr = o.date || new Date(o.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      mergedList.push({
        rawId,
        orderId: displayOrderId,
        customer: customerName,
        date: dateStr,
        paymentMethod,
        paymentStatus,
        fulfillmentStatus,
        amount: Number(o.totalPrice || o.amount || 0),
        rawTimestamp: o.createdAt || o.paidAt || o.date || new Date().toISOString()
      } as any);
    });

    mergedList.sort((a: any, b: any) => {
      const timeA = new Date(a.rawTimestamp).getTime() || 0;
      const timeB = new Date(b.rawTimestamp).getTime() || 0;
      return timeB - timeA;
    });

    setOrders(mergedList);
  };

const ordersChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('shopkart_orders_sync_channel') : null;

  useEffect(() => {
    fetchOrders();
    const handleOrdersUpdated = () => fetchOrders();

    if (ordersChannel) {
      ordersChannel.onmessage = () => {
        fetchOrders();
      };
    }

    window.addEventListener('shopkart-orders-updated', handleOrdersUpdated);

    return () => {
      window.removeEventListener('shopkart-orders-updated', handleOrdersUpdated);
    };
  }, []);

  // Combo Chart
  useEffect(() => {
    if (!comboChartRef.current) return;
    if (comboChartInstance.current) comboChartInstance.current.destroy();

    const ctx = comboChartRef.current.getContext('2d');
    if (!ctx) return;

    comboChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            type: 'bar',
            label: 'Orders',
            data: [210, 245, 228, 268, 289, 312],
            backgroundColor: '#4f46e5',
            hoverBackgroundColor: '#4338ca',
            borderRadius: 4,
            maxBarThickness: 32,
            order: 2,
          },
          {
            type: 'line',
            label: 'Target',
            data: [230, 230, 230, 260, 260, 260],
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#f59e0b',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            tension: 0,
            fill: false,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#4b5563' } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#4b5563' } },
          y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#4b5563' } },
        },
      },
    });
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.paymentStatus.toLowerCase() === statusFilter || o.fulfillmentStatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      
      {toastMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Orders vs Monthly Target Combo Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
        <h2 className="text-sm font-medium text-gray-900">Orders vs monthly target</h2>
        <div className="mt-4 h-64">
          <canvas ref={comboChartRef} aria-label="Orders Target Combo Chart"></canvas>
        </div>
      </div>

      {/* All Orders Table Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-gray-900">All orders</h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search orders"
                className="w-full rounded-md border border-gray-200 py-1.5 pl-3 pr-9 text-sm text-gray-900 shadow-2xs focus:outline-none focus:border-indigo-600 sm:w-56"
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 grid w-8 place-content-center text-gray-400">
                <Search className="size-4" />
              </span>
            </div>

            <div className="inline-flex rounded-md border border-gray-200 p-0.5 text-xs font-medium bg-white">
              {(['all', 'paid', 'pending', 'refunded'] as const).map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-sm px-2.5 py-1 capitalize transition ${
                    statusFilter === filter
                      ? 'bg-gray-100 text-gray-900 font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 text-left text-xs">
            <thead>
              <tr className="font-medium text-gray-900">
                <th className="px-3 py-2 whitespace-nowrap">Order</th>
                <th className="px-3 py-2 whitespace-nowrap">Customer</th>
                <th className="px-3 py-2 whitespace-nowrap">Date</th>
                <th className="px-3 py-2 whitespace-nowrap">Payment</th>
                <th className="px-3 py-2 whitespace-nowrap">Fulfillment Status</th>
                <th className="px-3 py-2 whitespace-nowrap text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-600" colSpan={6}>
                    No orders match your search.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o, i) => {
                  const isPrepaid = o.paymentStatus === 'Paid' || (o.paymentMethod !== 'COD' && o.paymentMethod !== 'Cash on Delivery');
                  const isRefunded = o.fulfillmentStatus === 'Refunded';

                  const isCancelled = o.fulfillmentStatus === 'Cancelled';

                  const selectOptions = isCancelled
                    ? [
                        { label: 'Cancelled', value: 'Cancelled' },
                        { label: 'Refunded', value: 'Refunded' }
                      ]
                    : [
                        { label: 'Order Placed', value: 'Order Placed' },
                        { label: 'Processing', value: 'Processing' },
                        { label: 'Shipped', value: 'Shipped' },
                        { label: 'Out for Delivery', value: 'Out for Delivery' },
                        { label: 'Delivered', value: 'Delivered' },
                        { label: 'Cancelled', value: 'Cancelled' },
                        ...(isPrepaid ? [{ label: 'Refunded', value: 'Refunded' }] : [])
                      ];

                  const selectVariant = o.fulfillmentStatus === 'Shipped' || o.fulfillmentStatus === 'Out for Delivery'
                    ? 'cyan'
                    : o.fulfillmentStatus === 'Processing'
                    ? 'orange'
                    : o.fulfillmentStatus === 'Cancelled'
                    ? 'rose'
                    : 'emerald';

                  return (
                    <tr key={i} className="text-gray-900 hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono font-semibold">{o.orderId}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-medium">{o.customer}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">{o.date}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <KokonutBadge
                          label={isRefunded ? `Refunded • ${o.paymentMethod}` : `${o.paymentStatus} • ${o.paymentMethod}`}
                          variant={isRefunded ? 'purple' : o.paymentStatus === 'Paid' ? 'emerald' : 'orange'}
                        />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {o.fulfillmentStatus === 'Delivered' ? (
                          <KokonutBadge label="Delivered" variant="emerald" />
                        ) : o.fulfillmentStatus === 'Refunded' ? (
                          <KokonutBadge label="Refunded" variant="purple" />
                        ) : (o.fulfillmentStatus === 'Cancelled' && !isPrepaid) ? (
                          <KokonutBadge label="Cancelled" variant="rose" />
                        ) : (
                          <KokonutSelect
                            value={o.fulfillmentStatus}
                            onChange={val => handleUpdateFulfillmentStatus(o.rawId, val)}
                            options={selectOptions}
                            variant={selectVariant}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right font-bold">
                        {format(o.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> of{' '}
              <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    currentPage === page
                      ? 'bg-[#242b27] text-white shadow-2xs'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminOrdersPage;
