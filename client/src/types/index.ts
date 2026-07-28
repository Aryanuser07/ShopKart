export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  phone?: string;
  addresses?: Address[];
  wishlist?: string[];
}

export interface Product {
  _id?: string;
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
  features?: string[];
  isFeatured?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  itemCount?: number;
}

export interface Review {
  _id: string;
  product: string;
  user: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  _id?: string;
  id: string;
  user: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
  } | string;
  orderItems: {
    product: string | Product;
    title: string;
    price: number;
    image: string;
    quantity: number;
  }[];
  shippingAddress: Address;
  paymentMethod: 'Stripe' | 'COD' | 'TestMode';
  paymentResult?: {
    id?: string;
    status?: string;
    updateTime?: string;
    emailAddress?: string;
  };
  isPaid: boolean;
  paidAt?: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Refunded';
  trackingNumber: string;
  estimatedDelivery?: string;
  trackingHistory: TrackingEvent[];
  createdAt: string;
}

export interface AnalyticsSummary {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
}
