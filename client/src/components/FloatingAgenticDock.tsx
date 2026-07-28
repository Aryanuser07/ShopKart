import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Sparkles, Heart, User, Shield, Zap, Compass } from 'lucide-react';
import Dock from './Dock/Dock';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface FloatingAgenticDockProps {
  onOpenAssistant: () => void;
}

export const FloatingAgenticDock: React.FC<FloatingAgenticDockProps> = ({ onOpenAssistant }) => {
  const navigate = useNavigate();
  const { setIsCartOpen } = useCart();
  const { isAdmin } = useAuth();

  const dockItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Home',
      onClick: () => navigate('/')
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: 'Catalog',
      onClick: () => navigate('/products')
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      label: 'Tech & Audio',
      onClick: () => navigate('/products?category=Electronics')
    },
    {
      icon: <Compass className="w-5 h-5 text-emerald-600" />,
      label: 'Fashion & Sneakers',
      onClick: () => navigate('/products?category=Fashion%20%26%20Footwear')
    },
    {
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      label: 'Wishlist',
      onClick: () => navigate('/wishlist')
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-[#eb9800]" />,
      label: 'Open Cart',
      onClick: () => setIsCartOpen(true)
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#eb9800] animate-pulse" />,
      label: 'AI Assistant',
      onClick: onOpenAssistant
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'Profile',
      onClick: () => navigate('/profile')
    },
    ...(isAdmin
      ? [
          {
            icon: <Shield className="w-5 h-5 text-amber-600" />,
            label: 'Admin Suite',
            onClick: () => navigate('/admin')
          }
        ]
      : [])
  ];

  return (
    <Dock
      items={dockItems}
      panelHeight={64}
      baseItemSize={44}
      magnification={68}
      distance={180}
      spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
    />
  );
};

export default FloatingAgenticDock;
