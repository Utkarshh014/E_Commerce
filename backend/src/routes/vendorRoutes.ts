import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  authGuard,
  requireApprovedVendor,
  requireProductOwnership,
} from '../middleware/authMiddleware';
import { ProductService } from '../services/ProductService';
import { OrderService } from '../services/OrderService';
import { NotificationService } from '../services/NotificationService';
import { PaymentService } from '../services/PaymentService';
import { InventoryService } from '../services/InventoryService';
import { DiscountService } from '../services/DiscountService';
import { CartService } from '../services/CartService';
import { EmailNotifier } from '../observers/EmailNotifier';
import { InAppNotifier } from '../observers/InAppNotifier';
import { OrderStatus } from '../interfaces/IOrderState';

// ─── Vendor Routes ───────────────────────────────────────────────────
// All routes require authGuard + requireApprovedVendor.
// Product mutation routes additionally require requireProductOwnership.

const router = Router();
router.use(authGuard, requireApprovedVendor);

const productService = new ProductService();

const orderService = new OrderService(
  new NotificationService([new EmailNotifier(), new InAppNotifier()]),
  new PaymentService(),
  new InventoryService(),
  new DiscountService(),
  new CartService()
);

// ─── Validation ──────────────────────────────────────────────────────
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').trim().notEmpty().withMessage('Category ID is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('productType').isIn(['physical', 'digital']).withMessage('productType must be physical or digital'),
];

// ─── Vendor Product Routes ───────────────────────────────────────────

/**
 * GET /api/vendor/products
 * List only this vendor's products.
 */
router.get('/products', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await productService.getAllProducts({
      vendorId: req.userId!,
      categoryId: req.query.categoryId as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string,
      productType: req.query.productType as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vendor/products
 * Create a product — vendorId auto-injected from JWT.
 */
router.post('/products', validateProduct, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    // Force vendorId to be the authenticated vendor — never trust the body
    req.body.vendorId = req.userId;

    const product = await productService.createProduct(req.body.productType, req.body);
    res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/vendor/products/:id
 * Update own product only.
 */
router.put(
  '/products/:id',
  requireProductOwnership,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Prevent vendor from changing ownership
      delete req.body.vendorId;
      const product = await productService.updateProduct(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: { product } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/vendor/products/:id
 * Delete own product only.
 */
router.delete(
  '/products/:id',
  requireProductOwnership,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await productService.deleteProduct(req.params.id as string);
      res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Vendor SubOrder Routes ──────────────────────────────────────────

/**
 * GET /api/vendor/orders
 * Returns only this vendor's subOrders (true isolation).
 */
router.get('/orders', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getVendorOrders(req.userId!);
    res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/vendor/orders/:orderId/status
 * Update this vendor's subOrder status only.
 * Body: { status: 'Shipped' | 'Delivered' | 'Cancelled' }
 */
router.patch(
  '/orders/:orderId/status',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status: OrderStatus };
      if (!status) {
        res.status(400).json({ success: false, message: 'status is required' });
        return;
      }
      const order = await orderService.updateSubOrderStatus(
        req.params.orderId as string,
        req.userId!,
        status
      );
      res.status(200).json({ success: true, data: { order } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
