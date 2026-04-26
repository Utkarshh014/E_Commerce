import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { OrderService } from '../services/OrderService';
import { NotificationService } from '../services/NotificationService';
import { PaymentService } from '../services/PaymentService';
import { InventoryService } from '../services/InventoryService';
import { DiscountService } from '../services/DiscountService';
import { CartService } from '../services/CartService';
import { EmailNotifier } from '../observers/EmailNotifier';
import { InAppNotifier } from '../observers/InAppNotifier';
import { CreditCardPayment } from '../strategies/payments/CreditCardPayment';
import { UPIPayment } from '../strategies/payments/UPIPayment';
import { WalletPayment } from '../strategies/payments/WalletPayment';
import { MockStripePayment } from '../strategies/payments/MockStripePayment';
import { IPaymentStrategy } from '../interfaces/IPaymentStrategy';
import { OrderStatus } from '../interfaces/IOrderState';
import { AppError } from '../utils/AppError';

// ─── Order Controller ───────────────────────────────────────────────
// Thin HTTP handler — ALL logic delegated to OrderService.
// Dependency Injection: services wired together here.

// Wire up services with dependency injection
const notificationService = new NotificationService([
  new EmailNotifier(),
  new InAppNotifier(),
]);
const paymentService = new PaymentService();
const inventoryService = new InventoryService();
const discountService = new DiscountService();
const cartService = new CartService();

const orderService = new OrderService(
  notificationService,
  paymentService,
  inventoryService,
  discountService,
  cartService
);

// ─── Payment Strategy Factory (resolves strategy from request body) ──
function resolvePaymentStrategy(body: Record<string, unknown>): IPaymentStrategy {
  const method = body.paymentMethod as string;

  switch (method) {
    case 'credit_card':
      return new CreditCardPayment(
        (body.cardNumber as string) || '4111111111111111',
        (body.expiryDate as string) || '12/28'
      );
    case 'upi':
      return new UPIPayment((body.upiId as string) || 'user@upi');
    case 'wallet':
      return new WalletPayment(parseFloat(body.walletBalance as string) || 1000);
    case 'stripe':
      return new MockStripePayment((body.clientSecret as string) || 'mock_secret_123');
    default:
      throw AppError.badRequest(`Unsupported payment method: ${method}`);
  }
}

export class OrderController {
  static async placeOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentStrategy = resolvePaymentStrategy(req.body);

      const order = await orderService.placeOrder({
        userId: req.userId!,
        paymentStrategy,
        shippingAddress: req.body.shippingAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        discountRequest: req.body.discount,
      });

      res.status(201).json({ success: true, data: { order } });
    } catch (error) {
      next(error);
    }
  }

  static async transitionOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // S2: Verify the caller owns the order (customers can only act on their own orders)
      // Admins bypass this check and can transition any order.
      if (req.userRole !== 'admin') {
        const order = await orderService.getOrderById(req.params.id as string);
        if ((order.userId as any).toString() !== req.userId) {
          res.status(403).json({ success: false, message: 'You do not have permission to update this order.' });
          return;
        }
      }

      const order = await orderService.transitionTo(
        req.params.id as string,
        req.body.status as OrderStatus
      );
      res.status(200).json({ success: true, data: { order } });
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getUserOrders(req.userId!);
      res.status(200).json({ success: true, data: { orders } });
    } catch (error) {
      next(error);
    }
  }

  static async getAllOrders(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getAllOrders();
      res.status(200).json({ success: true, data: { orders } });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.getOrderById(req.params.id as string);
      res.status(200).json({ success: true, data: { order } });
    } catch (error) {
      next(error);
    }
  }

  static async getVendorOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.userRole !== 'vendor') {
        res.status(403).json({ success: false, message: 'Only vendors can view vendor orders' });
        return;
      }
      const orders = await orderService.getVendorOrders(req.userId!);
      res.status(200).json({ success: true, data: { orders } });
    } catch (error) {
      next(error);
    }
  }
}
