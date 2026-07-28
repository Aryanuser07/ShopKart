import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  CreditCard,
  Settings,
  Sparkles,
  Menu,
  X,
  Plus,
  Download,
  ArrowLeft,
  FileText,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Text3DFlip from '../../components/Text3DFlip';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Navigation Links
  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Billing', path: '/admin/billing', icon: CreditCard },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Dynamic Header Titles & Actions
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/admin/customers':
        return { title: 'Customers', actionText: 'Add customer', actionIcon: Plus, actionType: 'add-customer' };
      case '/admin/orders':
        return { title: 'Orders', actionText: 'Export orders', actionIcon: Download, actionType: 'export-orders' };
      case '/admin/products':
        return { title: 'Products', actionText: 'Add product', actionIcon: Plus, actionType: 'add-product' };
      case '/admin/billing':
        return { title: 'Billing', actionText: 'Download invoices', actionIcon: Download, actionType: 'download-invoices' };
      case '/admin/settings':
        return { title: 'Settings', actionText: 'Save changes', actionIcon: Save, actionType: 'save-settings' };
      case '/admin':
      default:
        return { title: 'Overview', actionText: 'New report', actionIcon: Plus, actionType: 'new-report' };
    }
  };

  const headerInfo = getHeaderInfo();
  const ActionIcon = headerInfo.actionIcon;

  const handleHeaderAction = () => {
    window.dispatchEvent(new CustomEvent('admin-header-action', { detail: { actionType: headerInfo.actionType } }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf9f6] font-sans text-slate-900 selection:bg-[#eb9800] selection:text-slate-950">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col justify-between overflow-y-auto border-e border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:shrink-0 lg:translate-x-0`}
      >
        <div className="p-4">
          
          {/* 3D Animated Logo */}
          <Link to="/" className="flex items-center space-x-2 px-2 py-1 group">
            <div className="w-8 h-8 rounded-lg bg-[#eb9800] flex items-center justify-center text-slate-950 font-black shadow-xs group-hover:scale-105 transition">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div className="flex items-center text-xl font-black tracking-tight">
              <Text3DFlip
                textClassName="text-[#242b27]"
                flipTextClassName="text-[#eb9800]"
                rotateDirection="top"
                staggerDuration={0.03}
                staggerFrom="first"
              >
                Shop
              </Text3DFlip>
              <Text3DFlip
                textClassName="text-[#eb9800]"
                flipTextClassName="text-[#242b27]"
                rotateDirection="top"
                staggerDuration={0.03}
                staggerFrom="first"
              >
                Kart
              </Text3DFlip>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Dashboard Navigation" className="mt-6">
            <ul className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#eb9800]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom Storefront & User Profile Card */}
        <div className="sticky inset-x-0 bottom-0 border-t border-slate-200 bg-white">
          <Link
            to="/"
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#eb9800] border-b border-slate-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </Link>

          <div className="flex items-center gap-3 bg-white p-4">
            <img
              alt="Admin Profile"
              src={user?.avatar || 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&q=80&w=300'}
              className="size-10 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <div className="text-xs text-slate-900 min-w-0">
              <strong className="block font-semibold truncate">{user?.name || 'Priya Natarajan'}</strong>
              <span className="text-slate-500 block truncate">{user?.email || 'priya@orbitly.com'}</span>
            </div>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="cursor-pointer rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle Menu"
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <h1 className="text-lg font-semibold text-slate-900">{headerInfo.title}</h1>
          </div>

          <button
            onClick={handleHeaderAction}
            className="flex items-center space-x-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 shadow-xs active:scale-95"
          >
            <ActionIcon className="w-4 h-4 text-[#eb9800]" />
            <span>{headerInfo.actionText}</span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 space-y-6 p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
