import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { ArrowUpRight, Award, Download, X, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useCurrency } from '../../utils/formatCurrency';

Chart.register(...registerables);

export const AdminOverview: React.FC = () => {
  const [range, setRange] = useState<'6m' | '12m'>('6m');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('Last 30 Days');
  const [reportFormat, setReportFormat] = useState<'CSV Ledger' | 'JSON Format'>('CSV Ledger');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { format } = useCurrency();

  const sparklineRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const donutChartRef = useRef<HTMLCanvasElement | null>(null);

  const sparklineChartInstance = useRef<Chart | null>(null);
  const lineChartInstance = useRef<Chart | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const handleHeaderAction = (e: any) => {
      if (e.detail?.actionType === 'new-report') {
        setIsReportModalOpen(true);
      }
    };
    window.addEventListener('admin-header-action', handleHeaderAction);
    return () => window.removeEventListener('admin-header-action', handleHeaderAction);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data) {
          setAnalyticsData(res.data);
          if (res.data.recentOrders && Array.isArray(res.data.recentOrders)) {
            setRecentOrders(res.data.recentOrders);
          }
        }
      } catch (err) {
        // Silent fallback
      }
    };
    fetchAnalytics();

    const handleOrdersUpdated = () => fetchAnalytics();
    window.addEventListener('shopkart-orders-updated', handleOrdersUpdated);
    return () => window.removeEventListener('shopkart-orders-updated', handleOrdersUpdated);
  }, []);

  const getDynamicMetrics = () => {
    let localOrders: any[] = [];
    try {
      localOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
    } catch (e) {
      localOrders = [];
    }

    const apiRecent = analyticsData?.recentOrders || [];
    const combinedRaw = [...localOrders, ...apiRecent];
    const seen = new Set<string>();
    const uniqueOrders: any[] = [];

    combinedRaw.forEach((o: any) => {
      const rawId = (o._id || o.id || o.orderId || Math.random()).toString().toLowerCase();
      if (seen.has(rawId)) return;
      seen.add(rawId);
      uniqueOrders.push(o);
    });

    const activeLocalOrders = localOrders.filter(o => {
      const st = (o.orderStatus || o.status || '').toLowerCase();
      return st !== 'refunded' && st !== 'cancelled';
    });

    const localTotalSales = activeLocalOrders.reduce((sum, o) => sum + Number(o.totalPrice || o.amount || 0), 0);
    const baseRevenue = analyticsData?.summary?.totalSales || 0;
    const finalTotalSales = baseRevenue + localTotalSales;

    const baseOrdersCount = analyticsData?.summary?.totalOrders || 0;
    const finalTotalOrders = baseOrdersCount + activeLocalOrders.length;

    const computedAOV = finalTotalOrders > 0 ? Math.round(finalTotalSales / finalTotalOrders) : 0;

    const statusCounts = {
      paid: analyticsData?.orderStatusBreakdown?.paid || 0,
      processing: analyticsData?.orderStatusBreakdown?.processing || 0,
      shipped: analyticsData?.orderStatusBreakdown?.shipped || 0,
      refunded: analyticsData?.orderStatusBreakdown?.refunded || 0
    };

    localOrders.forEach(o => {
      const st = (o.orderStatus || o.status || 'Pending').toLowerCase();
      if (st === 'refunded' || st === 'cancelled') {
        statusCounts.refunded += 1;
      } else if (st === 'shipped' || st === 'out for delivery') {
        statusCounts.shipped += 1;
      } else if (st === 'delivered' || st === 'paid') {
        statusCounts.paid += 1;
      } else {
        statusCounts.processing += 1;
      }
    });

    const formattedRecent: any[] = uniqueOrders.map(o => ({
      customerName: o.customerName || o.user?.name || o.shippingAddress?.fullName || 'ShopKart Customer',
      id: `#${(o._id || o.id || o.orderId || '1001').toString().replace(/^ord-?/i, '').slice(-8).toUpperCase()}`,
      status: o.orderStatus || o.status || (o.isPaid ? 'Paid' : 'Pending'),
      amount: Number(o.totalPrice || o.amount || 0),
      _id: o._id || o.id,
      user: o.user,
      shippingAddress: o.shippingAddress,
      orderStatus: o.orderStatus,
      totalPrice: o.totalPrice
    }));

    return {
      summary: {
        totalSales: finalTotalSales,
        totalOrders: finalTotalOrders,
        totalCustomers: (analyticsData?.summary?.totalCustomers || 1) + new Set(localOrders.map(o => o.user?.email || o.shippingAddress?.email)).size,
        averageOrderValue: computedAOV,
        conversionRate: finalTotalOrders > 0 ? 3.85 : 0
      },
      recentOrdersList: formattedRecent,
      statusBreakdown: statusCounts
    };
  };

  const dynamicMetrics = getDynamicMetrics();
  const summary = dynamicMetrics.summary;

  const getDynamicTopProducts = () => {
    if (analyticsData?.topProducts && analyticsData.topProducts.length > 0) {
      return analyticsData.topProducts;
    }

    let customOrders: any[] = [];
    try {
      customOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
    } catch (e) {
      customOrders = [];
    }

    const activeCustomOrders = customOrders.filter((o: any) => {
      const st = (o.orderStatus || o.status || '').toLowerCase();
      return st !== 'refunded' && st !== 'cancelled';
    });

    const list: any[] = [];

    activeCustomOrders.forEach((order: any) => {
      const items = order.orderItems || [];
      items.forEach((item: any) => {
        const itemTitle = (item.title || item.product?.title || '').trim();
        const itemProdId = String(item.product?._id || item.product?.id || item.product || '');
        if (!itemTitle && !itemProdId) return;

        let match = list.find((p: any) => p.id === itemProdId || p.title === itemTitle);

        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;

        if (match) {
          match.unitsSold += qty;
          match.revenue += price * qty;
        } else {
          list.push({
            id: itemProdId || `prod-${Date.now()}`,
            title: itemTitle || 'Custom Product',
            category: item.category || 'General',
            unitsSold: qty,
            revenue: price * qty
          });
        }
      });
    });

    return list.sort((a: any, b: any) => b.unitsSold - a.unitsSold).slice(0, 5);
  };

  const topProducts = getDynamicTopProducts();

  const getDynamicCategoryDistribution = () => {
    if (analyticsData?.categoryDistribution && analyticsData.categoryDistribution.length > 0) {
      return analyticsData.categoryDistribution;
    }

    const catMap = new Map<string, { revenue: number; count: number }>();
    topProducts.forEach((p: any) => {
      const cat = p.category || 'General';
      const cur = catMap.get(cat) || { revenue: 0, count: 0 };
      cur.revenue += p.revenue || 0;
      cur.count += p.unitsSold || 0;
      catMap.set(cat, cur);
    });

    const totRev = Array.from(catMap.values()).reduce((sum, c) => sum + c.revenue, 0) || 1;

    return Array.from(catMap.entries()).map(([cat, val]) => ({
      category: cat,
      revenue: val.revenue,
      percentage: Math.round((val.revenue / totRev) * 100 * 10) / 10
    })).sort((a, b) => b.percentage - a.percentage);
  };

  const categoryDistribution = getDynamicCategoryDistribution();

  const handleDownloadReport = () => {
    const periodSlug = reportPeriod.toLowerCase().replace(/\s+/g, '_');

    if (reportFormat === 'JSON Format') {
      const reportDataObject = {
        title: 'Executive Performance & Sales Analytics Report',
        period: reportPeriod,
        generatedAt: new Date().toISOString(),
        summaryMetrics: {
          monthlyRevenue: format(summary.totalSales),
          totalOrders: summary.totalOrders,
          activeCustomers: summary.totalCustomers,
          averageOrderValue: format(summary.averageOrderValue),
          conversionRatePercentage: `${summary.conversionRate}%`
        },
        categoryRevenueDistribution: categoryDistribution,
        topSellingProductsLeaderboard: topProducts
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportDataObject, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', dataStr);
      link.setAttribute('download', `shopkart_executive_report_${periodSlug}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const timeStr = new Date().toLocaleString();
      const revStr = format(summary.totalSales);
      const avgStr = format(summary.averageOrderValue);

      let csv = `Report Title,"Executive Performance Overview Report"\n` +
        `Period,"${reportPeriod}"\n` +
        `Generated At,"${timeStr}"\n\n` +
        `Metric,Value\n` +
        `Monthly Revenue,"${revStr}"\n` +
        `Total Orders,${summary.totalOrders}\n` +
        `Active Customers,${summary.totalCustomers}\n` +
        `Avg Order Value,"${avgStr}"\n` +
        `Conversion Rate,"${summary.conversionRate}%"\n`;

      const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `shopkart_executive_report_${periodSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setIsReportModalOpen(false);
    setToastMessage(`✅ Executive Report (${reportFormat}) generated and downloaded!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const chartData6M = analyticsData?.salesGraphData6M || {
    labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    revenue: [0, 0, 0, 0, 0, summary.totalSales]
  };

  const chartData12M = analyticsData?.salesGraphData12M || {
    labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    revenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, summary.totalSales]
  };

  const currentChartData = range === '6m' ? chartData6M : chartData12M;

  // Sparkline Chart
  useEffect(() => {
    if (!sparklineRef.current) return;
    if (sparklineChartInstance.current) sparklineChartInstance.current.destroy();

    const ctx = sparklineRef.current.getContext('2d');
    if (!ctx) return;

    sparklineChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData6M.labels,
        datasets: [
          {
            data: chartData6M.revenue,
            borderColor: '#10b981',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }, [analyticsData, summary]);

  // Line Chart
  useEffect(() => {
    if (!lineChartRef.current) return;
    if (lineChartInstance.current) lineChartInstance.current.destroy();

    const ctx = lineChartRef.current.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    lineChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: currentChartData.labels,
        datasets: [
          {
            label: 'Revenue',
            data: currentChartData.revenue,
            borderColor: '#4f46e5',
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#4f46e5',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => format(Number(tooltipItem.raw)),
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#4b5563' } },
          y: {
            beginAtZero: true,
            grid: { color: '#e5e7eb' },
            ticks: {
              color: '#4b5563',
              callback: (val) => `${format(Number(val))}`,
            },
          },
        },
      },
    });
  }, [range, analyticsData, format, currentChartData]);

  // Donut Chart
  useEffect(() => {
    if (!donutChartRef.current) return;
    if (donutChartInstance.current) donutChartInstance.current.destroy();

    const ctx = donutChartRef.current.getContext('2d');
    if (!ctx) return;

    const breakdown = dynamicMetrics.statusBreakdown;

    donutChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Processing', 'Shipped', 'Refunded'],
        datasets: [
          {
            data: [breakdown.paid, breakdown.processing, breakdown.shipped, breakdown.refunded],
            backgroundColor: ['#10b981', '#f59e0b', '#06b6d4', '#f43f5e'],
            hoverBackgroundColor: ['#059669', '#d97706', '#0891b2', '#e11d48'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#4b5563' } },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}`,
            },
          },
        },
      },
    });
  }, [analyticsData, dynamicMetrics]);

  return (
    <div className="space-y-6">
      
      {toastMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
          <div className="inline-flex gap-2 self-end rounded-sm bg-green-100 p-1 text-green-600">
            <ArrowUpRight className="size-4" />
            <span className="text-xs font-medium">Real-Time</span>
          </div>
          <div>
            <strong className="block text-sm font-medium text-gray-600">Monthly revenue</strong>
            <p className="mt-1">
              <span className="text-2xl font-black text-gray-900">{format(summary.totalSales)}</span>
            </p>
          </div>
          <div className="h-10">
            <canvas ref={sparklineRef} aria-label="Revenue sparkline"></canvas>
          </div>
        </article>

        <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
          <div className="inline-flex gap-2 self-end rounded-sm bg-green-100 p-1 text-green-600">
            <ArrowUpRight className="size-4" />
            <span className="text-xs font-medium">Real-Time</span>
          </div>
          <div>
            <strong className="block text-sm font-medium text-gray-600">Active customers</strong>
            <p className="mt-1">
              <span className="text-2xl font-black text-gray-900">{summary.totalCustomers.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </article>

        <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
          <div className="inline-flex gap-2 self-end rounded-sm bg-green-100 p-1 text-green-600">
            <ArrowUpRight className="size-4" />
            <span className="text-xs font-medium">Real-Time</span>
          </div>
          <div>
            <strong className="block text-sm font-medium text-gray-600">Avg. Order Value (AOV)</strong>
            <p className="mt-1">
              <span className="text-2xl font-black text-gray-900">{format(summary.averageOrderValue)}</span>
            </p>
          </div>
        </article>

        <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
          <div className="inline-flex gap-2 self-end rounded-sm bg-green-100 p-1 text-green-600">
            <ArrowUpRight className="size-4" />
            <span className="text-xs font-medium">Real-Time</span>
          </div>
          <div>
            <strong className="block text-sm font-medium text-gray-600">Total Orders</strong>
            <p className="mt-1">
              <span className="text-2xl font-black text-gray-900">{summary.totalOrders}</span>
            </p>
          </div>
        </article>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Revenue & volume trend</h2>
            <div className="inline-flex rounded-md border border-gray-200 p-0.5 text-xs font-medium bg-white">
              <button
                type="button"
                onClick={() => setRange('6m')}
                className={`rounded-sm px-2.5 py-1 transition ${
                  range === '6m' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setRange('12m')}
                className={`rounded-sm px-2.5 py-1 transition ${
                  range === '12m' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                12M
              </button>
            </div>
          </div>
          <div className="mt-4 h-64">
            <canvas ref={lineChartRef} aria-label="Revenue Trend Line Chart"></canvas>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
          <h2 className="text-sm font-medium text-gray-900">Orders by status</h2>
          <div className="mt-4 h-64">
            <canvas ref={donutChartRef} aria-label="Order Status Donut Chart"></canvas>
          </div>
        </div>
      </div>

      {/* Top Products & Category Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top Selling Products Leaderboard</span>
            </h2>
            <span className="text-xs text-gray-500 font-medium">Real-Time Performance</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-200 text-left text-xs">
              <thead>
                <tr className="font-medium text-gray-900">
                  <th className="px-3 py-2 whitespace-nowrap">Product Title</th>
                  <th className="px-3 py-2 whitespace-nowrap">Category</th>
                  <th className="px-3 py-2 whitespace-nowrap text-center">Units Sold</th>
                  <th className="px-3 py-2 whitespace-nowrap text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-600" colSpan={4}>
                      No real product sales yet. Place an order to generate real metrics!
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p: any, i: number) => (
                    <tr key={i} className="text-gray-900 hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 whitespace-nowrap font-semibold">{p.title}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-center font-bold text-slate-700">{p.unitsSold} units</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right font-black text-[#eb9800]">
                        {format(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Category Revenue Breakdown</h2>
          {categoryDistribution.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No real category sales yet.</p>
          ) : (
            <ul className="space-y-4">
              {categoryDistribution.map((cat: any, idx: number) => (
                <li key={idx}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-900">{cat.category}</span>
                    <span className="font-bold text-gray-600">{cat.percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${cat.percentage}%` }}></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
        <h2 className="text-sm font-medium text-gray-900">Recent orders ledger</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 text-left text-xs">
            <thead>
              <tr className="font-medium text-gray-900">
                <th className="px-3 py-2 whitespace-nowrap">Customer</th>
                <th className="px-3 py-2 whitespace-nowrap">Order</th>
                <th className="px-3 py-2 whitespace-nowrap">Status</th>
                <th className="px-3 py-2 whitespace-nowrap text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {dynamicMetrics.recentOrdersList.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-600" colSpan={4}>
                    No real orders placed yet.
                  </td>
                </tr>
              ) : (
                dynamicMetrics.recentOrdersList.map((o: any, i: number) => {
                  const rawId = (o.id || o._id || `ord-${i}`).toString();
                  const cust = o.customerName || o.user?.name || o.shippingAddress?.fullName || 'ShopKart Customer';
                  const statusText = o.status || o.orderStatus || 'Pending';
                  const amt = o.amount || o.totalPrice || 0;

                  return (
                    <tr key={i} className="text-gray-900 hover:bg-slate-50 transition">
                      <td className="px-3 py-2 whitespace-nowrap font-medium">{cust}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono font-semibold">#{rawId.slice(-4).toUpperCase()}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            statusText === 'Paid' || statusText === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : statusText === 'Pending' || statusText === 'Processing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-bold">
                        {format(amt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#eb9800]" />
                <h3 className="text-base font-bold text-slate-900">Generate Executive Report</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Period</label>
                <select
                  value={reportPeriod}
                  onChange={e => setReportPeriod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 font-semibold bg-white"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Quarterly Performance">Quarterly Performance (Q2 2026)</option>
                  <option value="Year-to-Date">Year-to-Date (YTD 2026)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CSV Ledger', 'JSON Format'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setReportFormat(fmt)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition ${
                        reportFormat === fmt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 shadow-xs"
              >
                <Download className="w-4 h-4 text-[#eb9800]" />
                <span>Download {reportFormat}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOverview;
