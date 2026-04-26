import { Router } from 'express';
import { ProductController, validateProduct } from '../controllers/ProductController';
import { authGuard, requireApprovedVendor, requireProductOwnership } from '../middleware/authMiddleware';
import reviewRoutes from './reviewRoutes';

const router = Router();

// Public routes
router.get('/', ProductController.getAll);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getById);

// Reviews sub-route
router.use('/:productId/reviews', reviewRoutes);

// Admin/Vendor routes — ownership enforced for mutations
router.post('/', authGuard, requireApprovedVendor, validateProduct, ProductController.create);
router.put('/:id', authGuard, requireApprovedVendor, requireProductOwnership, ProductController.update);
router.delete('/:id', authGuard, requireApprovedVendor, requireProductOwnership, ProductController.delete);

export default router;
