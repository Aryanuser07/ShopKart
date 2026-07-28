import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('shopkart_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user && user.wishlist) {
      setWishlistIds(user.wishlist);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('shopkart_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const toggleWishlist = async (productId: string) => {
    setWishlistIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    if (user) {
      try {
        await api.post('/auth/wishlist/toggle', { productId });
      } catch (err) {
        // Handled silently
      }
    }
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const clearWishlist = () => {
    setWishlistIds([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
