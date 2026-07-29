// In-memory dataset fallback for zero-config preview mode
import bcrypt from 'bcryptjs';

const ADMIN_HASH = bcrypt.hashSync('admin123', 10);

export interface MemoryProduct {
  _id: string;
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  rating: number;
  numReviews: number;
  features: string[];
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryCategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  itemCount: number;
}

export interface MemoryUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin';
  avatar: string;
  phone: string;
  addresses: any[];
  wishlist: string[];
  createdAt: string;
}

export interface MemoryOTP {
  email: string;
  hashedOtp: string;
  purpose: 'signup' | 'login';
  expiresAt: number;
  createdAt: number;
  attempts: number;
  registrationData?: {
    name: string;
    email: string;
    passwordHash: string;
  };
}

export interface MemoryOrder {
  _id: string;
  id: string;
  user: string | any;
  orderItems: any[];
  shippingAddress: any;
  paymentMethod: string;
  paymentResult?: any;
  isPaid: boolean;
  paidAt?: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Refunded';
  trackingNumber: string;
  estimatedDelivery: string;
  trackingHistory: any[];
  createdAt: string;
}

export const INITIAL_CATEGORIES: MemoryCategory[] = [
  {
    _id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    description: 'Latest audio gear, laptops, and smart accessories',
    itemCount: 4
  },
  {
    _id: 'cat-2',
    name: 'Fashion & Footwear',
    slug: 'fashion-footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
    description: 'Trending sneakers, streetwear, and active lifestyle apparel',
    itemCount: 3
  },
  {
    _id: 'cat-3',
    name: 'Home & Living',
    slug: 'home-living',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600',
    description: 'Minimalist decor, smart lamps, and ergonomic workspace items',
    itemCount: 3
  },
  {
    _id: 'cat-4',
    name: 'Gaming & Wearables',
    slug: 'gaming-wearables',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=600',
    description: 'High performance gaming headsets and smart fitness trackers',
    itemCount: 2
  }
];

export const INITIAL_PRODUCTS: MemoryProduct[] = [
  {
    _id: 'prod-1',
    id: 'prod-1',
    title: 'Aura Studio Wireless Noise-Canceling Headphones',
    slug: 'aura-studio-wireless-headphones',
    description: 'Experience studio-grade acoustic clarity with active noise cancellation, custom 40mm drivers, and up to 40 hours of battery life.',
    price: 14999,
    originalPrice: 19999,
    category: 'Electronics',
    brand: 'AeroSound',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.8,
    numReviews: 42,
    features: ['Active Noise Cancellation', 'Bluetooth 5.3 Quick-Pair', '40 Hours Playback', 'USB-C Fast Charge'],
    isFeatured: true,
    tags: ['wireless', 'headphones', 'anc', 'audio'],
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'prod-2',
    id: 'prod-2',
    title: 'UltraSpeed Pro M2 Wireless Gaming Mouse',
    slug: 'ultraspeed-pro-m2-wireless-mouse',
    description: 'Ultra-lightweight 58g ergonomic gaming mouse with 26,000 DPI optical sensor and 1000Hz polling rate for competitive esports.',
    price: 4499,
    originalPrice: 5999,
    category: 'Electronics',
    brand: 'Nexus Gaming',
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.7,
    numReviews: 31,
    features: ['58 Gram Ultra Lightweight', 'PAW3395 26K Sensor', 'PTFE Glides', 'Custom RGB Software'],
    isFeatured: true,
    tags: ['gaming', 'mouse', 'wireless', 'esports'],
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'prod-3',
    id: 'prod-3',
    title: 'VaporMax Air Kinetic Running Sneakers',
    slug: 'vapormax-air-kinetic-sneakers',
    description: 'Next-gen responsive cushioning engineered with breathable mesh upper and durable rubber outsole for high performance marathon running.',
    price: 8999,
    originalPrice: 11999,
    category: 'Fashion & Footwear',
    brand: 'StrideLab',
    stock: 14,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.9,
    numReviews: 68,
    features: ['Air Kinetic Cushioning', 'Breathable FlyMesh', 'Reflective Night Accents', 'Anti-Slip Tread'],
    isFeatured: true,
    tags: ['sneakers', 'running', 'footwear', 'sports'],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'prod-4',
    id: 'prod-4',
    title: 'Chronos Smart Watch Ultra Titanium Edition',
    slug: 'chronos-smart-watch-ultra-titanium',
    description: 'Rugged titanium casing, sapphire crystal glass, precision dual-frequency GPS, and continuous heart-rate & SpO2 monitoring.',
    price: 18999,
    originalPrice: 24999,
    category: 'Gaming & Wearables',
    brand: 'Chronos',
    stock: 8,
    images: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.6,
    numReviews: 24,
    features: ['Titanium Case', '100m Water Resistance', 'Always-On AMOLED Display', '14-Day Battery Life'],
    isFeatured: true,
    tags: ['smartwatch', 'wearables', 'titanium', 'fitness'],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'prod-5',
    id: 'prod-5',
    title: 'Lumina Minimalist Ergonomic Desk Lamp',
    slug: 'lumina-minimalist-desk-lamp',
    description: 'Eye-care LED lamp featuring touch dimming, adjustable color temperatures (2700K - 6500K), and built-in 15W Qi Wireless Charger.',
    price: 3499,
    originalPrice: 4999,
    category: 'Home & Living',
    brand: 'Lumina Home',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.5,
    numReviews: 19,
    features: ['15W Fast Wireless Charging', 'No-Flicker Eye Protection', 'Touch Control Dimmer', 'Auto-Shutoff Timer'],
    isFeatured: false,
    tags: ['home', 'lamp', 'desk', 'decor', 'lighting'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'prod-6',
    id: 'prod-6',
    title: 'Urban Canvas Roll-Top Backpack',
    slug: 'urban-canvas-rolltop-backpack',
    description: 'Weatherproof waxed canvas backpack with padded 16-inch laptop compartment, hidden security pocket, and ergonomic shoulder straps.',
    price: 4999,
    originalPrice: 6499,
    category: 'Fashion & Footwear',
    brand: 'UrbanCraft',
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.8,
    numReviews: 39,
    features: ['Water Resistant Waxed Canvas', '16" Padded Laptop Sleeve', 'Expandable Roll Top', 'YKK Zippers'],
    isFeatured: false,
    tags: ['backpack', 'fashion', 'travel', 'bags'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_USERS: MemoryUser[] = [
  {
    _id: 'user-admin-1',
    id: 'user-admin-1',
    name: 'ShopKart Admin',
    email: 'admin@shopkart.com',
    password: ADMIN_HASH,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    phone: '+91 98765 43210',
    addresses: [
      {
        street: '100 Tech Park Way, Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postalCode: '201301',
        country: 'India',
        isDefault: true
      }
    ],
    wishlist: [],
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ORDERS: MemoryOrder[] = [];

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../../data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const loadJsonData = (filePath: string, fallback: any) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    // Silent fallback
  }
  return fallback;
};

const saveJsonData = (filePath: string, data: any) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Silent fallback
  }
};

class MemoryStore {
  products: MemoryProduct[] = loadJsonData(PRODUCTS_FILE, [...INITIAL_PRODUCTS]);
  categories: MemoryCategory[] = [...INITIAL_CATEGORIES];
  users: MemoryUser[] = [...INITIAL_USERS];
  reviews: any[] = [];
  otps: Map<string, MemoryOTP> = new Map();

  saveProducts() {
    saveJsonData(PRODUCTS_FILE, this.products);
  }
}

export const memoryStore = new MemoryStore();
