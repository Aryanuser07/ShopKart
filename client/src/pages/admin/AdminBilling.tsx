import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Download, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { useCurrency } from '../../utils/formatCurrency';

interface InvoiceItem {
  id: string;
  date: string;
  status: string;
  amount: number;
  plan: string;
}

const INVOICES_LIST: InvoiceItem[] = [
  { id: 'INV-2026-003', date: 'Jun 1, 2026', status: 'Paid', amount: 24999, plan: 'ShopKart Enterprise Suite' },
  { id: 'INV-2026-002', date: 'May 1, 2026', status: 'Paid', amount: 24999, plan: 'ShopKart Enterprise Suite' },
  { id: 'INV-2026-001', date: 'Apr 1, 2026', status: 'Paid', amount: 24999, plan: 'ShopKart Enterprise Suite' },
];

export const AdminBilling: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { format } = useCurrency();

  const handleDownloadAllInvoices = () => {
    let csv = 'Invoice ID,Billing Date,Status,Amount,Plan Title\n';
    INVOICES_LIST.forEach(inv => {
      csv += `"${inv.id}","${inv.date}","${inv.status}","${format(inv.amount)}","${inv.plan}"\n`;
    });

    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'shopkart_all_invoices_ledger_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('✅ Complete billing invoice ledger downloaded as CSV!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadSingleInvoice = (inv: InvoiceItem) => {
    let csv = `"ShopKart E-Commerce Official Billing Statement"\n`;
    csv += `Invoice Number,"${inv.id}"\n`;
    csv += `Billing Date,"${inv.date}"\n`;
    csv += `Payment Status,"${inv.status}"\n`;
    csv += `Plan Title,"${inv.plan}"\n`;
    csv += `Subtotal,"${format(inv.amount)}"\n`;
    csv += `Tax (0%),"${format(0)}"\n`;
    csv += `Total Amount Paid,"${format(inv.amount)}"\n`;
    csv += `Payment Method,"Visa ending in 4242"\n`;

    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shopkart_invoice_${inv.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`✅ Individual Invoice ${inv.id} (${format(inv.amount)}) downloaded!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const handleHeaderAction = (e: any) => {
      if (e.detail?.actionType === 'download-invoices') {
        handleDownloadAllInvoices();
      }
    };
    window.addEventListener('admin-header-action', handleHeaderAction);
    return () => window.removeEventListener('admin-header-action', handleHeaderAction);
  }, [format]);

  return (
    <div className="space-y-6">
      
      {toastMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Current Plan & Payment Method Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        
        {/* Active Plan Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                Current Plan
              </span>
              <h2 className="mt-3 text-xl font-bold text-gray-900">ShopKart Enterprise Suite</h2>
              <p className="mt-1 text-xs text-gray-500">Billed annually • Renews on Nov 18, 2026</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-gray-900">{format(24999)}</span>
              <span className="text-xs text-gray-500"> / month</span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Unlimited Products & Inventory Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Agentic AI Recommendation Engine</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Stripe Dedicated Production Sandbox</span>
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-900">Payment method</h2>
            <div className="mt-4 flex items-center space-x-3 rounded-lg border border-gray-200 p-3">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              <div>
                <strong className="block text-xs font-semibold text-gray-900">Visa ending in 4242</strong>
                <span className="text-[10px] text-gray-500">Expires 12/28</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadAllInvoices}
            className="mt-4 w-full rounded-md border border-gray-300 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Invoices</span>
          </button>
        </div>

      </div>

      {/* Invoice History Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs">
        <h2 className="text-sm font-medium text-gray-900">Invoice history</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 text-left text-xs">
            <thead>
              <tr className="font-medium text-gray-900">
                <th className="px-3 py-2 whitespace-nowrap">Invoice ID</th>
                <th className="px-3 py-2 whitespace-nowrap">Date</th>
                <th className="px-3 py-2 whitespace-nowrap">Status</th>
                <th className="px-3 py-2 whitespace-nowrap">Amount</th>
                <th className="px-3 py-2 whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {INVOICES_LIST.map((inv, i) => (
                <tr key={i} className="text-gray-900 hover:bg-slate-50 transition">
                  <td className="px-3 py-2 whitespace-nowrap font-mono font-semibold">{inv.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">{inv.date}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold">{format(inv.amount)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDownloadSingleInvoice(inv)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:underline hover:text-indigo-800"
                      title={`Download Invoice ${inv.id}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Statement</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminBilling;
