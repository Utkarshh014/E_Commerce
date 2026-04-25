import { Router } from 'express';
import { ReviewController, validateReview } from '../controllers/ReviewController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

router.post('/', authGuard, validateReview, ReviewController.addReview);
router.get('/', ReviewController.getProductReviews);

export default router;
