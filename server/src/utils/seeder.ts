import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { INITIAL_PRODUCTS, INITIAL_USERS } from './store';
import bcrypt from 'bcryptjs';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/shopkart';

export const seedDatabase = async () => {
  try {
    console.log(`[Seeder] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ [Seeder] Connected to MongoDB.');

    // Clear existing collections
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log('🧹 [Seeder] Cleared existing Products, Users, and Orders.');

    // Seed Products
    const formattedProducts = INITIAL_PRODUCTS.map(p => ({
      title: p.title,
      slug: p.slug,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      category: p.category,
      brand: p.brand,
      stock: p.stock,
      images: p.images,
      rating: p.rating,
      numReviews: p.numReviews,
      features: p.features,
      isFeatured: p.isFeatured,
      tags: p.tags
    }));

    const seededProducts = await Product.insertMany(formattedProducts);
    console.log(`📦 [Seeder] Seeded ${seededProducts.length} products successfully.`);

    // Seed Users
    const defaultPassword = await bcrypt.hash('Password123!', 10);
    const formattedUsers = INITIAL_USERS.map(u => ({
      name: u.name,
      email: u.email,
      password: defaultPassword,
      role: u.role,
      avatar: u.avatar,
      phone: u.phone,
      addresses: u.addresses || []
    }));

    const seededUsers = await User.insertMany(formattedUsers);
    console.log(`👤 [Seeder] Seeded ${seededUsers.length} users successfully.`);

    // Seed Sample Orders
    const customerUser = seededUsers.find(u => u.role === 'customer') || seededUsers[0];
    const sampleProduct = seededProducts[0];

    const sampleOrder = {
      user: customerUser._id,
      customerName: customerUser.name,
      customerEmail: customerUser.email,
      orderItems: [
        {
          product: sampleProduct._id,
          title: sampleProduct.title,
          price: sampleProduct.price,
          image: sampleProduct.images[0],
          quantity: 1
        }
      ],
      shippingAddress: {
        fullName: customerUser.name,
        email: customerUser.email,
        street: '12 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India'
      },
      paymentMethod: 'Stripe',
      isPaid: true,
      paidAt: new Date(),
      itemsPrice: sampleProduct.price,
      taxPrice: Math.round(sampleProduct.price * 0.18),
      shippingPrice: 0,
      totalPrice: sampleProduct.price + Math.round(sampleProduct.price * 0.18),
      orderStatus: 'Delivered',
      fulfillmentStatus: 'Delivered',
      paymentStatus: 'Paid',
      trackingNumber: 'SK-IND-9988776',
      estimatedDelivery: new Date(),
      trackingHistory: [
        {
          status: 'Order Placed',
          location: 'Bengaluru, KA',
          timestamp: new Date(Date.now() - 86400000 * 3),
          note: 'Order confirmed'
        },
        {
          status: 'Delivered',
          location: 'Customer Address',
          timestamp: new Date(),
          note: 'Delivered successfully'
        }
      ]
    };

    await Order.create(sampleOrder);
    console.log('🛒 [Seeder] Seeded 1 initial sample order.');

    console.log('🎉 [Seeder] Database seeding complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ [Seeder] Error seeding database:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
