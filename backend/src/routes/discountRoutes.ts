import { Router } from 'express';
import { DiscountController } from '../controllers/DiscountController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

router.get('/coupons', DiscountController.getCoupons);
router.post('/apply', authGuard, DiscountController.applyDiscount);

export default router;
