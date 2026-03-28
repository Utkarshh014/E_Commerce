import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CartService } from '../services/CartService';

// ─── Cart Controller ────────────────────────────────────────────────
// Thin HTTP handler — ALL logic delegated to CartService.

const cartService = new CartService();

export class CartController {
  static async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getCart(req.userId!);
      res.status(200).json({ success: true, data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, quantity } = req.body;
      const cart = await cartService.addItem(req.userId!, productId, quantity || 1);
      res.status(200).json({ success: true, data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.removeItem(req.userId!, req.params.productId as string);
      res.status(200).json({ success: true, data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async updateQuantity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quantity } = req.body;
      const cart = await cartService.updateQuantity(req.userId!, req.params.productId as string, quantity);
      res.status(200).json({ success: true, data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.clearCart(req.userId!);
      res.status(200).json({ success: true, data: { cart } });
    } catch (error) {
      next(error);
    }
  }
}
