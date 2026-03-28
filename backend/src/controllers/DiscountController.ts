import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { DiscountService } from '../services/DiscountService';

// ─── Discount Controller ────────────────────────────────────────────

const discountService = new DiscountService();

export class DiscountController {
  static async applyDiscount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { price, type, value, couponCode } = req.body;
      const result = discountService.applyDiscount(price, {
        type,
        value,
        couponCode,
      });
      res.status(200).json({ success: true, data: { discount: result } });
    } catch (error) {
      next(error);
    }
  }

  static async getCoupons(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupons = discountService.getAvailableCoupons();
      res.status(200).json({ success: true, data: { coupons } });
    } catch (error) {
      next(error);
    }
  }
}
