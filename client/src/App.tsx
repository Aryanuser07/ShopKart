import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { FloatingAgenticDock } from './components/FloatingAgenticDock';
import { AgenticAssistantModal } from './components/AgenticAssistantModal';

import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { ProfilePage } from './pages/ProfilePage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import { AdminProducts } from './pages/admin/AdminProducts';
import AdminBilling from './pages/admin/AdminBilling';
import AdminSettings from './pages/admin/AdminSettings';
import { useAuth } from './context/AuthContext';
import api from './services/api';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);
  const location = useLocation();

  React.useEffect(() => {
    // 1. Sync custom local orders to server disk storage
    try {
      const localOrders = JSON.parse(localStorage.getItem('shopkart-custom-orders') || '[]');
      if (localOrders.length > 0) {
        api.post('/orders/sync', { orders: localOrders }).catch(() => {});
      }
    } catch (e) {
      // Silent
    }

    // 2. Sync custom local products to server disk storage
    try {
      const customProds = JSON.parse(localStorage.getItem('shopkart_custom_products') || '[]');
      if (customProds.length > 0) {
        api.post('/products/sync', { products: customProds }).catch(() => {});
      }
    } catch (e) {
      // Silent
    }
    // 3. Listen for logout events and redirect to Home page /
    const handleLogoutEvent = () => {
      window.location.href = '/';
    };
    window.addEventListener('shopkart-user-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('shopkart-user-logout', handleLogoutEvent);
    };
  }, []);
  const isAdminPath = location.pathname.startsWith('/admin');

  const handleOpenAssistant = (query?: string) => {
    setAssistantInitialQuery(query);
    setIsAssistantOpen(true);
  };

  const handleCloseAssistant = () => {
    setIsAssistantOpen(false);
    setAssistantInitialQuery(undefined);
  };

  if (isAdminPath) {
    return (
      <AdminRoute>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="customers text-gray-900" element={<AdminCustomers />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminRoute>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-[#242b27] font-sans selection:bg-[#eb9800] selection:text-slate-950">
      <Navbar />
      <CartDrawer />
      <FloatingAgenticDock onOpenAssistant={() => handleOpenAssistant()} />
      <AgenticAssistantModal isOpen={isAssistantOpen} onClose={handleCloseAssistant} initialQuery={assistantInitialQuery} />

      <main className="flex-1 bg-[#faf9f6]">
        <Routes>
          <Route path="/" element={<Home onOpenAssistant={handleOpenAssistant} />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};
