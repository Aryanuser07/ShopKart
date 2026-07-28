import { Router } from 'express';
import {
  getAnalytics,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  createCustomer,
  updateUserRole
} from '../controllers/adminController';
import { protect, isAdmin } from '../middleware/auth';

const router = Router();

router.use(protect, isAdmin);

router.get('/analytics', getAnalytics);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getAllUsers);
router.post('/users', createCustomer);
router.put('/users/:id/role', updateUserRole);

export default router;
