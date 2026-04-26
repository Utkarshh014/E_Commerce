import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { CartController } from '../controllers/CartController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

// All cart routes require authentication
router.use(authGuard);

// S4 + V3: Validate cart mutation inputs before they reach the service layer
const validateCartItem = [
  body('productId').optional().isString().notEmpty().withMessage('productId must be a non-empty string'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be an integer ≥ 1'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    next();
  },
];

router.get('/', CartController.getCart);
router.post('/items', validateCartItem, CartController.addItem);
router.delete('/items/:productId', CartController.removeItem);
router.patch('/items/:productId', validateCartItem, CartController.updateQuantity);
router.delete('/', CartController.clearCart);

export default router;
