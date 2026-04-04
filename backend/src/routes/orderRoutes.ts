import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authGuard, requireRole } from '../middleware/authMiddleware';

const router = Router();

// All order routes require authentication
router.use(authGuard);

// Customer routes
router.post('/', OrderController.placeOrder);
router.get('/my-orders', OrderController.getMyOrders);
router.get('/:id', OrderController.getOrderById);

// Admin-only routes
router.get('/', requireRole('admin'), OrderController.getAllOrders);
router.patch('/:id/status', requireRole('admin'), OrderController.transitionOrder);

export default router;
