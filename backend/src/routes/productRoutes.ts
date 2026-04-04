import { Router } from 'express';
import { ProductController, validateProduct } from '../controllers/ProductController';
import { authGuard, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', ProductController.getAll);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getById);

// Admin-only routes
router.post('/', authGuard, requireRole('admin'), validateProduct, ProductController.create);
router.put('/:id', authGuard, requireRole('admin'), ProductController.update);
router.delete('/:id', authGuard, requireRole('admin'), ProductController.delete);

export default router;
