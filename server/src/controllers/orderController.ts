import { Request, Response } from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { memoryStore } from '../utils/store';
import { sendOrderConfirmationEmail } from '../utils/emailService';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderItems, shippingAddress, paymentMethod = 'Stripe', customerUser } = req.body;
    const reqUser = req.user;

    const user = {
      id: customerUser?.id || customerUser?._id || reqUser?.id || reqUser?._id || 'user-guest',
      _id: customerUser?._id || customerUser?.id || reqUser?._id || reqUser?.id || 'user-guest',
      name: customerUser?.name || reqUser?.name || shippingAddress?.fullName || 'ShopKart Customer',
      email: customerUser?.email || reqUser?.email || shippingAddress?.email || ''
    };
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items specified' });
    }
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: 'Valid shipping address is required' });
    }

    // Validate stock limits for each item
    for (const item of orderItems) {
      const pId = String(item.product?._id || item.product?.id || item.product || '');
      const pTitle = (item.title || item.product?.title || '').trim();
      const qty = Number(item.quantity) || 1;

      const memProd = memoryStore.products.find(
        p => p._id === pId || p.id === pId || (p.title && p.title.toLowerCase().includes(pTitle.toLowerCase())) || (pTitle && pTitle.toLowerCase().includes(p.title.toLowerCase()))
      );

      if (memProd && qty > memProd.stock) {
        return res.status(400).json({
          message: `Cannot purchase ${qty} units of "${memProd.title}". Only ${memProd.stock} units available in stock!`
        });
      }
    }

    const itemsPrice = orderItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
    const shippingPrice = itemsPrice > 5000 ? 0 : 499;
    const taxPrice = Math.round(itemsPrice * 0.18); // 18% GST/Tax
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const trackingNumber = 'SK-' + Math.floor(1000000 + Math.random() * 9000000);
    const estimatedDelivery = new Date(Date.now() + 86400000 * 4).toISOString();

    const initialTrackingEvent = {
      status: 'Order Placed',
      location: `${shippingAddress.city}, ${shippingAddress.state || 'IN'}`,
      timestamp: new Date().toISOString(),
      note: 'Order confirmed and registered in ShopKart system'
    };

    // Try MongoDB
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB not connected, falling back to memoryStore');
      }
      const order = await Order.create({
        user: user.id || user._id,
        orderItems,
        shippingAddress: {
          ...shippingAddress,
          fullName: user.name || shippingAddress.fullName || 'ShopKart Customer',
          email: user.email || shippingAddress.email || ''
        },
        paymentMethod,
        isPaid: paymentMethod === 'TestMode' || paymentMethod === 'Stripe',
        paidAt: paymentMethod === 'TestMode' || paymentMethod === 'Stripe' ? new Date() : undefined,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        orderStatus: paymentMethod === 'Stripe' ? 'Processing' : 'Order Placed',
        trackingNumber,
        estimatedDelivery,
        trackingHistory: [initialTrackingEvent]
      });

      const populatedOrder = {
        ...order.toObject(),
        _id: String(order._id),
        id: String(order._id),
        paidAt: order.paidAt ? order.paidAt.toISOString() : undefined,
        user: {
          _id: String(user.id || user._id),
          id: String(user.id || user._id),
          name: user.name,
          email: user.email
        },
        customerName: user.name,
        customerEmail: user.email
      } as any;

      // Add to memoryStore for cross-session consistency
      memoryStore.orders.unshift(populatedOrder as any);
      memoryStore.saveOrders();

      // Deduct stock for each ordered item
      orderItems.forEach(async (item: any) => {
        const pId = String(item.product?._id || item.product?.id || item.product || '');
        const pTitle = (item.title || '').toLowerCase();
        const qty = Number(item.quantity) || 1;

        // Deduct in memoryStore
        const memProd = memoryStore.products.find(p => p._id === pId || p.id === pId || p.title.toLowerCase().includes(pTitle) || (pTitle && pTitle.includes(p.title.toLowerCase())));
        if (memProd) {
          memProd.stock = Math.max(0, memProd.stock - qty);
        }

        // Deduct in MongoDB
        try {
          if (mongoose.Types.ObjectId.isValid(pId)) {
            const dbProd = await Product.findById(pId);
            if (dbProd) {
              dbProd.stock = Math.max(0, dbProd.stock - qty);
              await dbProd.save();
            }
          }
        } catch (e) {
          // Fallback
        }
      });

      return res.status(201).json({ order: populatedOrder });
    } catch (dbErr) {
      // Memory Store fallback
      const newOrder = {
        _id: 'ord-' + Date.now(),
        id: 'ord-' + Date.now(),
        user: {
          _id: user.id || user._id,
          name: user.name,
          email: user.email
        },
        orderItems,
        shippingAddress,
        paymentMethod,
        paymentResult: paymentMethod === 'TestMode' ? { id: 'pi_test_' + Date.now(), status: 'succeeded' } : undefined,
        isPaid: true,
        paidAt: new Date().toISOString(),
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        orderStatus: 'Pending' as const,
        trackingNumber,
        estimatedDelivery,
        trackingHistory: [initialTrackingEvent],
        createdAt: new Date().toISOString()
      };

      memoryStore.orders.unshift(newOrder);
      memoryStore.saveOrders();

      // Deduct stock for each item in memoryStore
      orderItems.forEach((item: any) => {
        const pId = String(item.product?._id || item.product?.id || item.product || '');
        const pTitle = (item.title || '').toLowerCase();
        const qty = Number(item.quantity) || 1;

        const memProd = memoryStore.products.find(p => p._id === pId || p.id === pId || p.title.toLowerCase().includes(pTitle) || (pTitle && pTitle.includes(p.title.toLowerCase())));
        if (memProd) {
          memProd.stock = Math.max(0, memProd.stock - qty);
        }
      });

      // Send order receipt email via SMTP / sandbox
      const recipientEmail = user.email || shippingAddress?.email;
      if (recipientEmail) {
        sendOrderConfirmationEmail(recipientEmail, newOrder);
      }

      return res.status(201).json({ order: newOrder });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    let order = memoryStore.orders.find(o => o._id === orderId || o.id === orderId);

    if (!order) {
      try {
        order = await Order.findById(orderId) as any;
      } catch (err) {
        // Continue
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (stripe) {
      const line_items = order.orderItems.map((item: any) => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.title,
            images: [item.image]
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-success/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout`,
        client_reference_id: orderId
      });

      return res.json({ checkoutUrl: session.url, sessionId: session.id, testMode: false });
    }

    // Stripe Test Fallback mode
    order.isPaid = true;
    order.paidAt = new Date().toISOString();
    order.orderStatus = 'Processing';
    order.paymentResult = {
      id: 'pi_simulated_' + Date.now(),
      status: 'succeeded',
      updateTime: new Date().toISOString(),
      emailAddress: req.user?.email || 'customer@shopkart.com'
    };

    order.trackingHistory.push({
      status: 'Processing',
      location: 'ShopKart Automated Warehouse',
      timestamp: new Date().toISOString(),
      note: 'Payment verified via Stripe Test Sandbox mode'
    });

    return res.json({
      checkoutUrl: `/order-success/${order._id || order.id}?test_success=true`,
      testMode: true,
      order
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = (req.user?.email || '').toLowerCase();

    let dbOrders: any[] = [];
    try {
      if (mongoose.Types.ObjectId.isValid(String(userId))) {
        dbOrders = await Order.find({ user: userId }).sort({ createdAt: -1 });
      }
    } catch (err) {
      // Fallback
    }

    const memOrders = memoryStore.orders.filter(o => {
      const oEmail = (
        (typeof o.user === 'object' && o.user?.email) ||
        o.shippingAddress?.email ||
        (o as any).customerEmail ||
        (o as any).email ||
        ''
      ).trim().toLowerCase();

      const oUserId = typeof o.user === 'object' && o.user !== null
        ? String(o.user.id || o.user._id || '').trim().toLowerCase()
        : String(o.user || '').trim().toLowerCase();

      const reqUserId = String(userId || '').trim().toLowerCase();

      if (userEmail && oEmail && (userEmail === oEmail || oEmail.startsWith(userEmail.split('@')[0]) || userEmail.startsWith(oEmail.split('@')[0]))) return true;
      if (reqUserId && oUserId && (reqUserId === oUserId || reqUserId.includes(oUserId) || oUserId.includes(reqUserId))) return true;

      return false;
    });

    // Merge & deduplicate user orders
    const combined = [...dbOrders, ...memOrders];
    const seen = new Set<string>();
    const uniqueMyOrders = combined.filter(o => {
      const id = String(o._id || o.id || '').toLowerCase();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return res.json({ orders: uniqueMyOrders });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const order = await Order.findById(id).populate('user', 'name email');
          if (order) {
            return res.json({ order });
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    const targetId = String(id).toLowerCase().replace(/^ord-?/i, '').replace(/^#/, '');
    const order = memoryStore.orders.find(o => {
      const oId = String(o._id || o.id || (o as any).orderId || '').toLowerCase().replace(/^ord-?/i, '').replace(/^#/, '');
      const oTrack = String(o.trackingNumber || '').toLowerCase();
      return oId === targetId || oId.endsWith(targetId) || targetId.endsWith(oId) || oTrack === targetId;
    });

    if (order) {
      return res.json({ order });
    }

    return res.status(404).json({ message: 'Order not found' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const order = await Order.findById(id);
          if (order) {
            order.orderStatus = 'Cancelled';
            (order as any).fulfillmentStatus = 'Cancelled';
            order.trackingHistory.push({
              status: 'Cancelled',
              location: 'Customer Portal',
              timestamp: new Date(),
              note: 'Cancelled by customer'
            });
            await order.save();
            return res.json({ order, message: 'Order cancelled successfully' });
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    const targetId = String(id).toLowerCase().replace(/^ord-?/i, '').replace(/^#/, '');
    const order = memoryStore.orders.find(o => {
      const oId = String(o._id || o.id || (o as any).orderId || '').toLowerCase().replace(/^ord-?/i, '').replace(/^#/, '');
      const oTrack = String(o.trackingNumber || '').toLowerCase();
      return oId === targetId || oId.endsWith(targetId) || targetId.endsWith(oId) || oTrack === targetId;
    });

    if (order) {
      const currentSt = (order as any).fulfillmentStatus || order.orderStatus;
      if (currentSt === 'Pending' || currentSt === 'Processing' || currentSt === 'Order Placed') {
        order.orderStatus = 'Cancelled';
        (order as any).fulfillmentStatus = 'Cancelled';
        if (!order.trackingHistory) order.trackingHistory = [];
        order.trackingHistory.push({
          status: 'Cancelled',
          location: 'Customer Portal',
          timestamp: new Date().toISOString(),
          note: 'Cancelled by customer'
        });

        memoryStore.saveOrders();
        return res.json({ order, message: 'Order cancelled successfully' });
      } else {
        return res.status(400).json({ message: `Cannot cancel order in status: ${currentSt}` });
      }
    }

    return res.status(404).json({ message: 'Order not found' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const syncOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { order, orders } = req.body;
    const ordersToSync = Array.isArray(orders) ? orders : order ? [order] : [];

    ordersToSync.forEach((o: any) => {
      if (!o) return;
      const oId = String(o._id || o.id || o.orderId || '').toLowerCase();
      if (!oId) return;

      const existingIndex = memoryStore.orders.findIndex(m => {
        const mId = String(m._id || m.id || '').toLowerCase();
        return mId === oId || mId.endsWith(oId) || oId.endsWith(mId);
      });

      const formattedOrder: any = {
        ...o,
        _id: o._id || o.id || `ord-${Date.now()}`,
        id: o.id || o._id || `ord-${Date.now()}`,
        user: typeof o.user === 'object' && o.user !== null
          ? o.user
          : { name: o.customerName || o.customer || 'ShopKart Customer', email: o.customerEmail || '' },
        customerName: o.customerName || (typeof o.user === 'object' ? o.user?.name : '') || o.customer || 'ShopKart Customer',
        customerEmail: o.customerEmail || (typeof o.user === 'object' ? o.user?.email : '') || '',
        orderItems: o.orderItems || [],
        shippingAddress: o.shippingAddress || {},
        paymentMethod: o.paymentMethod || 'Stripe',
        isPaid: o.isPaid ?? true,
        totalPrice: o.totalPrice || o.amount || 0,
        orderStatus: o.orderStatus || o.fulfillmentStatus || 'Processing',
        createdAt: o.createdAt || new Date().toISOString()
      };

      if (existingIndex >= 0) {
        const existingOrder = memoryStore.orders[existingIndex];
        const serverStatus = (existingOrder as any).fulfillmentStatus || existingOrder.orderStatus;

        // If server order is Refunded, protect server status from stale local overwrite
        if (serverStatus === 'Refunded') {
          (formattedOrder as any).orderStatus = 'Refunded';
          (formattedOrder as any).fulfillmentStatus = 'Refunded';
          (formattedOrder as any).paymentStatus = 'Refunded';
        } else if (serverStatus === 'Cancelled' && formattedOrder.orderStatus === 'Refunded') {
          // Keep Refunded if local was updated to Refunded
          (existingOrder as any).orderStatus = 'Refunded';
          (existingOrder as any).fulfillmentStatus = 'Refunded';
        }

        memoryStore.orders[existingIndex] = { ...formattedOrder, ...existingOrder, orderStatus: existingOrder.orderStatus, fulfillmentStatus: (existingOrder as any).fulfillmentStatus || existingOrder.orderStatus };
      } else {
        memoryStore.orders.unshift(formattedOrder);
      }
    });

    memoryStore.saveOrders();

    return res.json({ success: true, count: memoryStore.orders.length });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
