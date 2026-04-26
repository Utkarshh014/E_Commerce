import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authGuard, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authGuard, requireRole('admin'));

router.get('/analytics', AdminController.getAnalytics);
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/vendor-status', AdminController.updateVendorStatus);
router.delete('/products/:id', AdminController.deleteProduct);

export default router;
