import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ReviewService } from '../services/ReviewService';
import { body, validationResult } from 'express-validator';

const reviewService = new ReviewService();

export const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Comment is required'),
];

export class ReviewController {
  static async addReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const review = await reviewService.addReview(
        req.userId!,
        req.params.productId as string,
        req.body.rating,
        req.body.comment
      );

      res.status(201).json({ success: true, data: { review } });
    } catch (error) {
      next(error);
    }
  }

  static async getProductReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await reviewService.getProductReviews(req.params.productId as string);
      res.status(200).json({ success: true, data: { reviews } });
    } catch (error) {
      next(error);
    }
  }
}
