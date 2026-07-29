import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Search, UserPlus, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

Chart.register(...registerables);

interface CustomerRow {
  name: string;
  email: string;
  plan: string;
  status: 'active' | 'trial' | 'past-due';
  joined: string;
}

const SEEDED_CUSTOMERS: CustomerRow[] = [];

export const AdminCustomers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState('Team');
  const [newStatus, setNewStatus] = useState<'active' | 'trial'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const handleHeaderAction = (e: any) => {
      if (e.detail?.actionType === 'add-customer') {
        setFormError(null);
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('admin-header-action', handleHeaderAction);
    return () => window.removeEventListener('admin-header-action', handleHeaderAction);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.users && Array.isArray(res.data.users)) {
        const apiUsers: CustomerRow[] = res.data.users.map((u: any) => ({
          name: u.name || 'Customer',
          email: u.email || 'user@shopkart.com',
          plan: u.plan || 'Starter',
          status: u.role === 'admin' ? 'active' : 'active',
          joined: new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));
        setCustomers(apiUsers);
      }
    } catch (err) {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Compute dynamic plan counts
  const teamCount = customers.filter(c => c.plan === 'Team').length;
  const starterCount = customers.filter(c => c.plan === 'Starter').length;
  const enterpriseCount = customers.filter(c => c.plan === 'Enterprise').length;
  const totalCount = customers.length || 1;

  const teamPct = Math.round((teamCount / totalCount) * 100);
  const starterPct = Math.round((starterCount / totalCount) * 100);
  const enterprisePct = Math.round((enterpriseCount / totalCount) * 100);

  // Initialize Bar Chart dynamically
  useEffect(() => {
    if (!barChartRef.current) return;
    if (barChartInstance.current) barChartInstance.current.destroy();

    const ctx = barChartRef.current.getContext('2d');
    if (!ctx) return;

    barChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'New customers',
            data: [0, 0, 0, 0, 0, 0, customers.length],
            backgroundColor: '#4f46e5',
            hoverBackgroundColor: '#4338ca',
            borderRadius: 4,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#4b5563' } },
          y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#4b5563', stepSize: 1 } },
        },
      },
    });
  }, [customers]);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    setIsSubmitting(true);
    setFormError(null);

    let created: CustomerRow = {
      name: newName,
      email: newEmail,
      plan: newPlan,
      status: newStatus,
      joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    try {
      const res = await api.post('/admin/users', {
        name: newName,
        email: newEmail,
        plan: newPlan,
        role: 'customer'
      });

      if (res.data?.user) {
        const u = res.data.user;
        created = {
          name: u.name || newName,
          email: u.email || newEmail,
          plan: newPlan,
          status: newStatus,
          joined: new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setFormError(err.response.data.message);
        setIsSubmitting(false);
        return;
      }
    }

    setCustomers(prev => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setFormError(null);
    setIsSubmitting(false);

    setToastMessage(`✅ Customer "${newName}" added successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.plan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {toastMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Charts Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2 shadow-2xs">
          <h2 className="text-sm font-medium text-gray-900">New customers</h2>
          <div className="mt-4 h-64">
            <canvas ref={barChartRef} aria-label="New Customers Bar Chart"></canvas>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
          <h2 className="text-sm font-medium text-gray-900">Customers by plan</h2>

          <ul className="mt-6 space-y-5">
            <li>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">Team</span>
                <span className="text-gray-600 font-bold">{teamCount}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${teamPct}%` }}></div>
              </div>
            </li>

            <li>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">Starter</span>
                <span className="text-gray-600 font-bold">{starterCount}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${starterPct}%` }}></div>
              </div>
            </li>

            <li>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">Enterprise</span>
                <span className="text-gray-600 font-bold">{enterpriseCount}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${enterprisePct}%` }}></div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-gray-900">All customers ({customers.length})</h2>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search customers"
                className="w-full rounded-md border border-gray-200 py-1.5 pl-3 pr-9 text-sm text-gray-900 shadow-2xs focus:outline-none focus:border-indigo-600 sm:w-56"
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 grid w-8 place-content-center text-gray-400">
                <Search className="size-4" />
              </span>
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-200 py-1.5 px-3 text-sm text-gray-900 shadow-2xs focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past-due">Past due</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 text-left text-xs">
            <thead>
              <tr className="font-medium text-gray-900">
                <th className="px-3 py-2 whitespace-nowrap">Customer</th>
                <th className="px-3 py-2 whitespace-nowrap">Email</th>
                <th className="px-3 py-2 whitespace-nowrap">Plan</th>
                <th className="px-3 py-2 whitespace-nowrap">Status</th>
                <th className="px-3 py-2 whitespace-nowrap">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-600" colSpan={5}>
                    No registered customers yet.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, i) => (
                  <tr key={i} className="text-gray-900 hover:bg-slate-50 transition">
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{c.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">{c.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-700">{c.plan}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          c.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : c.status === 'trial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : c.status === 'trial' ? 'Trial' : 'Past due'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{c.joined}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handleAddCustomerSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#eb9800]" />
                <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
                ⚠️ {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan</label>
                  <select
                    value={newPlan}
                    onChange={e => setNewPlan(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 bg-white"
                  >
                    <option value="Team">Team</option>
                    <option value="Starter">Starter</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminCustomers;
