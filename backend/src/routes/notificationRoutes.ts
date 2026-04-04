import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

router.use(authGuard);

router.get('/', NotificationController.getMyNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllRead);

export default router;
