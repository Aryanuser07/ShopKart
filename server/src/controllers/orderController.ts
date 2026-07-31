import { Response } from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { memoryStore } from '../utils/store';
import { sendOrderConfirmationEmail } from '../utils/emailService';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

// Helper to format order output for API contract compatibility
const formatOrder = (doc: any) => {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const idStr = String(o._id || o.id || '');
  const uObj = typeof o.user === 'object' && o.user !== null ? o.user : {};
  const custName = o.customerName || uObj.name || o.shippingAddress?.fullName || 'ShopKart Customer';
  const custEmail = o.customerEmail || uObj.email || o.shippingAddress?.email || '';

  const historyList = Array.isArray(o.trackingHistory) ? o.trackingHistory : [];
  const latestHistory = historyList.length > 0 ? historyList[historyList.length - 1] : null;
  const derivedHistoryStatus = (latestHistory && latestHistory.status && latestHistory.status !== 'Pending' && latestHistory.status !== 'Order Placed')
    ? latestHistory.status
    : null;

  const finalStatus = derivedHistoryStatus || o.fulfillmentStatus || o.orderStatus || 'Processing';

  return {
    ...o,
    _id: idStr,
    id: idStr,
    user: {
      _id: String(uObj._id || uObj.id || o.user || 'user-customer-1'),
      id: String(uObj.id || uObj._id || o.user || 'user-customer-1'),
      name: custName,
      email: custEmail
    },
    customerName: custName,
    customerEmail: custEmail,
    orderStatus: finalStatus,
    fulfillmentStatus: finalStatus,
    paymentStatus: finalStatus === 'Refunded' ? 'Refunded' : (o.paymentStatus || (o.isPaid ? 'Paid' : 'Pending')),
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString()
  };
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderItems, shippingAddress, paymentMethod = 'Stripe', customerUser } = req.body;
    const reqUser = req.user;

    const user = {
      id: customerUser?.id || customerUser?._id || reqUser?.id || reqUser?._id || 'user-customer-1',
      _id: customerUser?._id || customerUser?.id || reqUser?._id || reqUser?.id || 'user-customer-1',
      name: customerUser?.name || reqUser?.name || shippingAddress?.fullName || 'ShopKart Customer',
      email: customerUser?.email || reqUser?.email || shippingAddress?.email || ''
    };

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items specified' });
    }
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: 'Valid shipping address is required' });
    }

    // Validate stock limits for each item in DB / memoryStore
    for (const item of orderItems) {
      const pId = String(item.product?._id || item.product?.id || item.product || '');
      const pTitle = (item.title || item.product?.title || '').trim();
      const qty = Number(item.quantity) || 1;

      let availStock: number | null = null;

      // Check DB first if valid ObjectId
      if (mongoose.Types.ObjectId.isValid(pId)) {
        const dbProd = await Product.findById(pId);
        if (dbProd) {
          availStock = dbProd.stock;
        }
      }

      // Fallback to memoryStore product catalog
      if (availStock === null) {
        const memProd = memoryStore.products.find(
          p => p._id === pId || p.id === pId || (p.title && p.title.toLowerCase().includes(pTitle.toLowerCase())) || (pTitle && pTitle.toLowerCase().includes(p.title.toLowerCase()))
        );
        if (memProd) {
          availStock = memProd.stock;
        }
      }

      if (availStock !== null && qty > availStock) {
        return res.status(400).json({
          message: `Cannot purchase ${qty} units of "${pTitle || 'item'}". Only ${availStock} units available in stock!`
        });
      }
    }

    const itemsPrice = orderItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
    const shippingPrice = itemsPrice > 5000 ? 0 : 499;
    const taxPrice = Math.round(itemsPrice * 0.18);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const trackingNumber = 'SK-' + Math.floor(1000000 + Math.random() * 9000000);
    const estimatedDelivery = new Date(Date.now() + 86400000 * 4);

    const initialTrackingEvent = {
      status: 'Order Placed',
      location: `${shippingAddress.city}, ${shippingAddress.state || 'IN'}`,
      timestamp: new Date(),
      note: 'Order confirmed and registered in ShopKart system'
    };

    const isPaid = paymentMethod === 'TestMode' || paymentMethod === 'Stripe';

    const mongoUserId = mongoose.Types.ObjectId.isValid(String(user.id || user._id))
      ? user.id || user._id
      : new mongoose.Types.ObjectId();

    const formattedOrderItems = orderItems.map((item: any) => {
      const pIdStr = String(item.product?._id || item.product?.id || item.product || '');
      return {
        ...item,
        product: mongoose.Types.ObjectId.isValid(pIdStr)
          ? pIdStr
          : new mongoose.Types.ObjectId()
      };
    });

    const orderDoc = await Order.create({
      user: mongoUserId,
      customerName: user.name,
      customerEmail: user.email,
      orderItems: formattedOrderItems,
      shippingAddress: {
        ...shippingAddress,
        fullName: user.name,
        email: user.email
      },
      paymentMethod,
      isPaid,
      paidAt: isPaid ? new Date() : undefined,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      orderStatus: paymentMethod === 'Stripe' ? 'Processing' : 'Pending',
      fulfillmentStatus: paymentMethod === 'Stripe' ? 'Processing' : 'Pending',
      paymentStatus: isPaid ? 'Paid' : 'Pending',
      trackingNumber,
      estimatedDelivery,
      trackingHistory: [initialTrackingEvent]
    });

    // Deduct stock for each ordered item in DB and memoryStore
    for (const item of orderItems) {
      const pId = String(item.product?._id || item.product?.id || item.product || '');
      const pTitle = (item.title || '').toLowerCase();
      const qty = Number(item.quantity) || 1;

      // Update in DB
      if (mongoose.connection.readyState === 1) {
        try {
          const cleanTitle = pTitle.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
          const filter: any = mongoose.Types.ObjectId.isValid(pId)
            ? { _id: pId }
            : {
                $or: [
                  { _id: pId },
                  { id: pId },
                  { slug: pId },
                  { title: new RegExp('^' + cleanTitle + '$', 'i') }
                ]
              };
          const dbProd = await Product.findOne(filter);
          if (dbProd) {
            dbProd.stock = Math.max(0, dbProd.stock - qty);
            await dbProd.save();
          }
        } catch (e) {
          // Ignore
        }
      }

      // Update in memoryStore products array
      const memProd = memoryStore.products.find(
        p => p._id === pId || p.id === pId || (p.title && p.title.toLowerCase().includes(pTitle))
      );
      if (memProd) {
        memProd.stock = Math.max(0, memProd.stock - qty);
      }
    }

    // Persist updated stock values to data/products.json so changes survive server restarts
    memoryStore.saveProducts();

    const formattedOrder = formatOrder(orderDoc);

    // Save order record to memoryStore and persist to data/orders.json
    memoryStore.orders.unshift({
      _id: String(formattedOrder._id || formattedOrder.id),
      id: String(formattedOrder.id || formattedOrder._id),
      user: {
        _id: String(user.id || (user as any)._id || ''),
        id: String(user.id || (user as any)._id || ''),
        name: user.name,
        email: user.email
      },
      orderItems,
      shippingAddress,
      paymentMethod,
      isPaid,
      paidAt: isPaid ? new Date().toISOString() : undefined,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      orderStatus: formattedOrder.orderStatus || 'Pending',
      trackingNumber,
      estimatedDelivery: estimatedDelivery.toISOString(),
      trackingHistory: [initialTrackingEvent],
      createdAt: new Date().toISOString()
    } as any);
    memoryStore.saveOrders();

    // Send confirmation email
    const recipientEmail = user.email || shippingAddress?.email;
    if (recipientEmail) {
      sendOrderConfirmationEmail(recipientEmail, formattedOrder);
    }

    return res.status(201).json({ order: formattedOrder });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    let order = await findOrderByIdOrNumber(orderId);

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
        success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-success/${order._id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout`,
        client_reference_id: String(order._id)
      });

      return res.json({ checkoutUrl: session.url, sessionId: session.id, testMode: false });
    }

    // Test Sandbox Mode (Simulated Payment)
    order.isPaid = true;
    order.paidAt = new Date();
    order.orderStatus = 'Processing';
    order.fulfillmentStatus = 'Processing';
    order.paymentStatus = 'Paid';
    order.paymentResult = {
      id: 'pi_simulated_' + Date.now(),
      status: 'succeeded',
      updateTime: new Date().toISOString(),
      emailAddress: req.user?.email || order.customerEmail || 'customer@shopkart.com'
    };

    order.trackingHistory.push({
      status: 'Processing',
      location: 'ShopKart Automated Warehouse',
      timestamp: new Date(),
      note: 'Payment verified via Stripe Test Sandbox mode'
    });

    await order.save();

    const formattedOrder = formatOrder(order);

    return res.json({
      checkoutUrl: `/order-success/${formattedOrder._id}?test_success=true`,
      testMode: true,
      order: formattedOrder
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = (req.user?.email || '').toLowerCase().trim();

    const queryConditions: any[] = [];
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      queryConditions.push({ user: userId });
    }
    if (userEmail) {
      queryConditions.push({ customerEmail: new RegExp(`^${userEmail}$`, 'i') });
      queryConditions.push({ 'shippingAddress.email': new RegExp(`^${userEmail}$`, 'i') });
    }

    const ordersDocs = queryConditions.length > 0
      ? await Order.find({ $or: queryConditions }).sort({ createdAt: -1 })
      : await Order.find().sort({ createdAt: -1 });

    const formattedOrders = ordersDocs.map(doc => formatOrder(doc));

    return res.json({ orders: formattedOrders });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderDoc = await findOrderByIdOrNumber(id);

    if (!orderDoc) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ order: formatOrder(orderDoc) });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await findOrderByIdOrNumber(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentStatus = order.fulfillmentStatus || order.orderStatus || 'Pending';
    if (['Pending', 'Processing', 'Order Placed'].includes(currentStatus)) {
      order.orderStatus = 'Cancelled';
      order.fulfillmentStatus = 'Cancelled';
      order.paymentStatus = 'Cancelled';

      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status: 'Cancelled',
        location: 'Customer Portal',
        timestamp: new Date(),
        note: 'Cancelled by customer'
      });

      await order.save();

      // Sync cancellation in memoryStore
      const memO = memoryStore.orders.find(o => (o._id || o.id) === id || o.trackingNumber === id);
      if (memO) {
        memO.orderStatus = 'Cancelled';
        (memO as any).fulfillmentStatus = 'Cancelled';
        (memO as any).paymentStatus = 'Cancelled';
        if (!memO.trackingHistory) memO.trackingHistory = [];
        memO.trackingHistory.push({ status: 'Cancelled', location: 'Customer Portal', timestamp: new Date().toISOString(), note: 'Cancelled by customer' });
        memoryStore.saveOrders();
      }

      return res.json({ order: formatOrder(order), message: 'Order cancelled successfully' });
    } else {
      return res.status(400).json({ message: `Cannot cancel order in status: ${currentStatus}` });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const syncOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { order, orders } = req.body;
    const statusRank: Record<string, number> = {
      'Pending': 1,
      'Order Placed': 1,
      'Processing': 2,
      'Shipped': 3,
      'Out for Delivery': 4,
      'Delivered': 5,
      'Cancelled': 6,
      'Refunded': 6
    };

    const ordersToSync = Array.isArray(orders) ? orders : order ? [order] : [];

    let count = 0;
    for (const o of ordersToSync) {
      if (!o) continue;
      const oId = String(o._id || o.id || o.orderId || '');

      const targetKey = oId.toLowerCase();
      const existingIdx = memoryStore.orders.findIndex(m => {
        const mId = String(m._id || m.id || '').toLowerCase();
        const mTrack = String(m.trackingNumber || '').toLowerCase();
        return (mId && mId === targetKey) ||
               (mTrack && mTrack === targetKey) ||
               (mId && targetKey && (mId.endsWith(targetKey) || targetKey.endsWith(mId)));
      });

      const existingMem = existingIdx >= 0 ? memoryStore.orders[existingIdx] : null;

      const incomingStatus = o.orderStatus || o.fulfillmentStatus || 'Processing';
      const existingStatus = existingMem ? (existingMem.orderStatus || (existingMem as any).fulfillmentStatus) : null;

      const currentRank = existingStatus ? (statusRank[existingStatus] || 0) : 0;
      const incomingRank = statusRank[incomingStatus] || 0;

      // Preserve existing advanced status if it was updated by Admin (e.g. Delivered, Shipped, Cancelled)
      const finalStatus = (existingStatus && currentRank >= incomingRank && existingStatus !== 'Pending' && existingStatus !== 'Order Placed')
        ? existingStatus
        : incomingStatus;

      const mongoUserId = mongoose.Types.ObjectId.isValid(String(o.user?.id || o.user?._id || o.user))
        ? o.user?.id || o.user?._id || o.user
        : new mongoose.Types.ObjectId();

      const formattedOrderItems = (o.orderItems || []).map((item: any) => {
        const pIdStr = String(item.product?._id || item.product?.id || item.product || '');
        return {
          ...item,
          product: mongoose.Types.ObjectId.isValid(pIdStr)
            ? pIdStr
            : new mongoose.Types.ObjectId()
        };
      });

      const payload: any = {
        user: mongoUserId,
        customerName: o.customerName || (typeof o.user === 'object' ? o.user?.name : '') || o.customer || 'ShopKart Customer',
        customerEmail: o.customerEmail || (typeof o.user === 'object' ? o.user?.email : '') || '',
        orderItems: formattedOrderItems,
        shippingAddress: o.shippingAddress || {},
        paymentMethod: o.paymentMethod || 'Stripe',
        isPaid: existingMem ? existingMem.isPaid : (o.isPaid ?? true),
        totalPrice: o.totalPrice || o.amount || 0,
        itemsPrice: o.itemsPrice || o.totalPrice || 0,
        taxPrice: o.taxPrice || 0,
        shippingPrice: o.shippingPrice || 0,
        orderStatus: finalStatus,
        fulfillmentStatus: finalStatus,
        paymentStatus: finalStatus === 'Refunded' ? 'Refunded' : (existingMem ? (existingMem as any).paymentStatus : (o.paymentStatus || (o.isPaid ? 'Paid' : 'Pending'))),
        trackingNumber: existingMem?.trackingNumber || o.trackingNumber || 'SK-' + Math.floor(1000000 + Math.random() * 9000000),
        estimatedDelivery: o.estimatedDelivery || existingMem?.estimatedDelivery || new Date(Date.now() + 86400000 * 4)
      };

      if (mongoose.Types.ObjectId.isValid(oId)) {
        try { await Order.findByIdAndUpdate(oId, payload, { upsert: true, new: true }); } catch (e) {}
      } else {
        try { await Order.create({ ...payload, trackingNumber: payload.trackingNumber }); } catch (e) {}
      }

      // Merge tracking history
      const existingHistory = existingMem?.trackingHistory || [];
      const incomingHistory = o.trackingHistory || [];
      const combinedHistory = [...existingHistory, ...incomingHistory];
      const historyMap = new Map<string, any>();
      combinedHistory.forEach((h: any) => {
        if (h && (h.status || h.note)) {
          const key = `${h.status}-${h.timestamp || h.note}`;
          if (!historyMap.has(key)) {
            historyMap.set(key, h);
          }
        }
      });

      const formattedMem: any = {
        _id: oId || existingMem?._id || `ord-${Date.now()}`,
        id: oId || existingMem?.id || `ord-${Date.now()}`,
        user: typeof o.user === 'object' ? o.user : { name: payload.customerName, email: payload.customerEmail },
        orderItems: o.orderItems && o.orderItems.length > 0 ? o.orderItems : (existingMem?.orderItems || []),
        shippingAddress: payload.shippingAddress,
        paymentMethod: payload.paymentMethod,
        isPaid: payload.isPaid,
        itemsPrice: payload.itemsPrice,
        taxPrice: payload.taxPrice,
        shippingPrice: payload.shippingPrice,
        totalPrice: payload.totalPrice,
        orderStatus: finalStatus,
        fulfillmentStatus: finalStatus,
        paymentStatus: payload.paymentStatus,
        trackingNumber: payload.trackingNumber,
        estimatedDelivery: payload.estimatedDelivery,
        trackingHistory: Array.from(historyMap.values()),
        createdAt: o.createdAt || existingMem?.createdAt || new Date().toISOString()
      };

      if (existingIdx >= 0) {
        memoryStore.orders[existingIdx] = {
          ...memoryStore.orders[existingIdx],
          ...formattedMem,
          orderStatus: finalStatus,
          fulfillmentStatus: finalStatus
        };
      } else {
        memoryStore.orders.unshift(formattedMem);
      }

      count++;
    }

    memoryStore.saveOrders();

    return res.json({ success: true, count });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Internal Helper to find order by ID or Tracking Number
async function findOrderByIdOrNumber(idOrNum: string) {
  if (!idOrNum) return null;
  const cleanId = String(idOrNum).trim();

  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    const doc = await Order.findById(cleanId);
    if (doc) return doc;
  }

  // Search by tracking number or regex substring
  const searchRegex = new RegExp(cleanId.replace(/^#/, '').replace(/^ord-?/i, ''), 'i');
  return await Order.findOne({
    $or: [
      { trackingNumber: cleanId },
      { trackingNumber: searchRegex },
      { customerEmail: searchRegex }
    ]
  });
}
