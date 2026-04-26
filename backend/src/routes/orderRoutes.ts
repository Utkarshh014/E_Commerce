import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authGuard, requireRole, requireApprovedVendor } from '../middleware/authMiddleware';

const router = Router();

// All order routes require authentication
router.use(authGuard);

// Customer routes
router.post('/', OrderController.placeOrder);
router.get('/my-orders', OrderController.getMyOrders);

// Vendor route (kept for backward compat — also available at /vendor/orders)
router.get('/vendor', requireApprovedVendor, OrderController.getVendorOrders);

// Admin-only routes — MUST be declared before /:id to avoid param shadowing
router.get('/all', requireRole('admin'), OrderController.getAllOrders);

// Param routes last
router.get('/:id', OrderController.getOrderById);
router.patch('/:id/status', requireRole('admin'), OrderController.transitionOrder);

export default router;

