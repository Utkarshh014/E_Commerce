import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

// All cart routes require authentication
router.use(authGuard);

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.delete('/items/:productId', CartController.removeItem);
router.patch('/items/:productId', CartController.updateQuantity);
router.delete('/', CartController.clearCart);

export default router;
