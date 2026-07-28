import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  syncProduct
} from '../controllers/productController';
import { protect, isAdmin } from '../middleware/auth';
import { validateProductInput } from '../middleware/validationMiddleware';

const router = Router();

router.get('/', getProducts);
router.post('/sync', syncProduct);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.post('/', protect, isAdmin, validateProductInput, createProduct);
router.put('/:id', protect, isAdmin, validateProductInput, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);
router.post('/:id/reviews', protect, addReview);

export default router;
