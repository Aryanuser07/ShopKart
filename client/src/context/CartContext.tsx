import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { getDeletedProductIds, getCustomProducts } from '../utils/productStorage';
import api from '../services/api';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productIdOrTarget: string | Product, quantity: number) => void;
  removeFromCart: (productIdOrTarget: string | Product) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  shippingPrice: number;
  taxPrice: number;
  discountAmount: number;
  totalPrice: number;
  couponCode: string;
  applyCoupon: (code: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('shopkart_cart');
    const items: CartItem[] = saved ? JSON.parse(saved) : [];
    const deletedSet = new Set(getDeletedProductIds().map(id => id.toLowerCase()));
    if (deletedSet.size === 0) return items;
    return items.filter(item => {
      const keys = [item.product._id, item.product.id, item.product.slug, item.product.title?.trim()]
        .filter(Boolean)
        .map(k => k!.toString().toLowerCase());
      return !keys.some(k => deletedSet.has(k));
    });
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    localStorage.setItem('shopkart_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Live stock sync with server API & localStorage
  useEffect(() => {
    const normalizeKey = (str: string | null | undefined): string => {
      if (!str) return '';
      return str
        .toLowerCase()
        .trim()
        .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
        .replace(/[^a-z0-9]/g, '');
    };

    const syncLiveStock = async () => {
      const customProds = getDeletedProductIds(); // trigger check
      const custom = getCustomProducts();
      let serverProds: any[] = [];
      try {
        const res = await api.get('/products?limit=100');
        if (res.data.products && Array.isArray(res.data.products)) {
          serverProds = res.data.products;
        }
      } catch (e) {}

      const allProds = [...custom, ...serverProds];

      setCartItems(prev => {
        let modified = false;
        const updated = prev.map(item => {
          const itemKeys = [item.product._id, item.product.id, item.product.slug, item.product.title]
            .filter(Boolean)
            .map(k => normalizeKey(k!.toString()));

          const match = allProds.find(p => {
            const pKeys = [p._id, p.id, p.slug, p.title]
              .filter(Boolean)
              .map(k => normalizeKey(k!.toString()));
            return pKeys.some(pk => itemKeys.includes(pk));
          });

          if (match && typeof match.stock === 'number') {
            const freshStock = match.stock;
            const newQty = freshStock <= 0 ? 0 : Math.min(freshStock, item.quantity);
            if (item.product.stock !== freshStock || item.quantity !== newQty) {
              modified = true;
              return {
                ...item,
                quantity: newQty,
                product: { ...item.product, stock: freshStock }
              };
            }
          }
          return item;
        });

        const filtered = updated.filter(item => item.quantity > 0);
        if (filtered.length !== prev.length) modified = true;
        return modified ? filtered : prev;
      });
    };

    const syncDeletedProducts = () => {
      const deletedSet = new Set(getDeletedProductIds().map(id => id.toLowerCase()));
      if (deletedSet.size > 0) {
        setCartItems(prev => prev.filter(item => {
          const itemKeys = [item.product._id, item.product.id, item.product.slug, item.product.title?.trim()]
            .filter(Boolean)
            .map(k => k!.toString().toLowerCase());
          return !itemKeys.some(k => deletedSet.has(k));
        }));
      }
      syncLiveStock();
    };

    const handleLogout = () => {
      setCartItems([]);
      setCouponCode('');
      setDiscountPercent(0);
      localStorage.removeItem('shopkart_cart');
    };

    syncDeletedProducts();
    window.addEventListener('shopkart-products-updated', syncDeletedProducts);
    window.addEventListener('shopkart-user-logout', handleLogout);
    window.addEventListener('focus', syncLiveStock);

    return () => {
      window.removeEventListener('shopkart-products-updated', syncDeletedProducts);
      window.removeEventListener('shopkart-user-logout', handleLogout);
      window.removeEventListener('focus', syncLiveStock);
    };
  }, []);

  const addToCart = (product: Product, quantity = 1) => {
    const maxStock = typeof product.stock === 'number' ? Math.max(0, product.stock) : 99;
    if (maxStock <= 0) return;

    setCartItems(prev => {
      const keysToMatch = new Set(
        [product._id, product.id, product.slug, product.title?.trim()]
          .filter(Boolean)
          .map(k => k!.toString().toLowerCase().replace(/[^a-z0-9]/g, ''))
      );

      const existing = prev.find(item => {
        const itemKeys = [item.product._id, item.product.id, item.product.slug, item.product.title?.trim()]
          .filter(Boolean)
          .map(k => k!.toString().toLowerCase().replace(/[^a-z0-9]/g, ''));
        return itemKeys.some(k => keysToMatch.has(k));
      });

      if (existing) {
        return prev.map(item => {
          const itemKeys = [item.product._id, item.product.id, item.product.slug, item.product.title?.trim()]
            .filter(Boolean)
            .map(k => k!.toString().toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (itemKeys.some(k => keysToMatch.has(k))) {
            const newQty = Math.min(maxStock, item.quantity + quantity);
            return { ...item, quantity: newQty };
          }
          return item;
        });
      }

      const initialQty = Math.min(maxStock, quantity);
      return [...prev, { product, quantity: initialQty }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productIdOrTarget: string | Product, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productIdOrTarget);
      return;
    }
    const keysToMatch = new Set<string>();
    if (typeof productIdOrTarget === 'string') {
      if (productIdOrTarget) keysToMatch.add(productIdOrTarget.toLowerCase().replace(/[^a-z0-9]/g, ''));
    } else if (productIdOrTarget) {
      if (productIdOrTarget._id) keysToMatch.add(productIdOrTarget._id.toString().toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (productIdOrTarget.id) keysToMatch.add(productIdOrTarget.id.toString().toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (productIdOrTarget.slug) keysToMatch.add(productIdOrTarget.slug.toString().toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (productIdOrTarget.title) keysToMatch.add(productIdOrTarget.title.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    }

    setCartItems(prev =>
      prev.map(item => {
        const itemKeys = [item.product._id, item.product.id, item.product.slug, item.product.title?.trim()]
          .filter(Boolean)
          .map(k => k!.toString().toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (itemKeys.some(k => keysToMatch.has(k))) {
          const maxStock = typeof item.product.stock === 'number' ? Math.max(0, item.product.stock) : 99;
          const cappedQty = Math.min(maxStock, quantity);
          return { ...item, quantity: cappedQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productIdOrTarget: string | Product) => {
    const keysToMatch = new Set<string>();
    if (typeof productIdOrTarget === 'string') {
      if (productIdOrTarget) keysToMatch.add(productIdOrTarget.toLowerCase());
    } else if (productIdOrTarget) {
      if (productIdOrTarget._id) keysToMatch.add(productIdOrTarget._id.toString().toLowerCase());
      if (productIdOrTarget.id) keysToMatch.add(productIdOrTarget.id.toString().toLowerCase());
      if (productIdOrTarget.slug) keysToMatch.add(productIdOrTarget.slug.toString().toLowerCase());
      if (productIdOrTarget.title) keysToMatch.add(productIdOrTarget.title.trim().toLowerCase());
    }

    setCartItems(prev =>
      prev.filter(item => {
        const itemKeys = [item.product._id, item.product.id, item.product.slug, item.product.title?.trim()]
          .filter(Boolean)
          .map(k => k!.toString().toLowerCase());
        return !itemKeys.some(k => keysToMatch.has(k));
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCouponCode('');
    setDiscountPercent(0);
  };

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'SHOPKART10' || clean === 'WELCOME10') {
      setCouponCode(clean);
      setDiscountPercent(10);
      return true;
    } else if (clean === 'BIGSAVE20' || clean === 'FESTIVE20') {
      setCouponCode(clean);
      setDiscountPercent(20);
      return true;
    }
    return false;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const shippingPrice = discountedSubtotal > 5000 || cartItems.length === 0 ? 0 : 499;
  const taxPrice = Math.round(discountedSubtotal * 0.18);
  const totalPrice = discountedSubtotal + shippingPrice + taxPrice;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        shippingPrice,
        taxPrice,
        discountAmount,
        totalPrice,
        couponCode,
        applyCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
