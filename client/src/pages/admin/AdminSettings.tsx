import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2, Globe, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, setGlobalCurrency } from '../../utils/formatCurrency';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState(() => localStorage.getItem('shopkart_storeName') || 'ShopKart E-Commerce');
  const [supportEmail, setSupportEmail] = useState(() => localStorage.getItem('shopkart_supportEmail') || user?.email || 'admin@shopkart.com');
  const [currency, setCurrency] = useState(() => localStorage.getItem('shopkart_currency') || 'INR');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    localStorage.setItem('shopkart_storeName', storeName);
    localStorage.setItem('shopkart_supportEmail', supportEmail);
    setGlobalCurrency(currency);

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 4000);
  };

  useEffect(() => {
    const handleHeaderAction = (e: any) => {
      if (e.detail?.actionType === 'save-settings') {
        handleSave();
      }
    };
    window.addEventListener('admin-header-action', handleHeaderAction);
    return () => window.removeEventListener('admin-header-action', handleHeaderAction);
  }, [storeName, supportEmail, currency]);

  return (
    <div className="space-y-6 max-w-4xl">
      
      {savedMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✅ Store configuration saved successfully! Default Currency is now active as {currency} ({formatPrice(14999)} sample product price).</span>
        </div>
      )}

      {/* General Store Settings Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>General Store & Multi-Currency Configuration</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select your default currency. Saving updates all prices live across the storefront, cart, checkout, and admin analytics!
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-500 block">Preview Price</span>
            <span className="text-sm font-black text-[#eb9800]">{formatPrice(14999)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 py-2 px-3 text-xs font-semibold text-gray-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={e => setSupportEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 py-2 px-3 text-xs font-semibold text-gray-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Active Storefront Default Currency</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: 'INR', label: 'INR (₹ - Indian Rupee)', symbol: '₹' },
                { code: 'USD', label: 'USD ($ - US Dollar)', symbol: '$' },
                { code: 'EUR', label: 'EUR (€ - Euro)', symbol: '€' },
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setCurrency(item.code)}
                  className={`p-3 rounded-xl border text-left font-bold transition flex flex-col justify-between ${
                    currency === item.code
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs">{item.label}</span>
                  <span className="text-lg font-black mt-2 text-[#eb9800]">{item.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminSettings;
