import { Router } from 'express';
import {
  createOrder,
  createCheckoutSession,
  getMyOrders,
  getOrderById,
  cancelOrder,
  syncOrder
} from '../controllers/orderController';
import { getAllOrders } from '../controllers/adminController';
import { protect, isAdmin } from '../middleware/auth';
import { validateOrderInput } from '../middleware/validationMiddleware';

const router = Router();

router.post('/', protect, validateOrderInput, createOrder);
router.post('/sync', syncOrder);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/all-orders', protect, isAdmin, getAllOrders);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
