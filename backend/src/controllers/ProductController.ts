import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ProductService } from '../services/ProductService';
import { body, validationResult } from 'express-validator';

// ─── Product Controller ─────────────────────────────────────────────
// Thin HTTP handler — ALL logic delegated to ProductService.

const productService = new ProductService();

export const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').trim().notEmpty().withMessage('Category ID is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('productType').isIn(['physical', 'digital']).withMessage('Product type must be physical or digital'),
];

export class ProductController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      // C5: Only inject vendorId from JWT when the caller IS a vendor.
      // Admins must supply vendorId explicitly in the body.
      if (req.userRole === 'vendor') {
        req.body.vendorId = req.userId;
      }

      const product = await productService.createProduct(req.body.productType, req.body);
      res.status(201).json({ success: true, data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // V1: Guard parseFloat/parseInt against NaN — invalid strings treated as undefined
      const rawMinPrice = parseFloat(req.query.minPrice as string);
      const rawMaxPrice = parseFloat(req.query.maxPrice as string);
      const rawPage = parseInt(req.query.page as string, 10);
      const rawLimit = parseInt(req.query.limit as string, 10);

      const result = await productService.getAllProducts({
        categoryId: req.query.category as string || req.query.categoryId as string,
        vendorId: req.query.vendorId as string,
        minPrice: !isNaN(rawMinPrice) ? rawMinPrice : undefined,
        maxPrice: !isNaN(rawMaxPrice) ? rawMaxPrice : undefined,
        search: req.query.search as string,
        productType: req.query.productType as string,
        page: !isNaN(rawPage) ? rawPage : undefined,
        limit: !isNaN(rawLimit) ? rawLimit : undefined,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id as string);
      res.status(200).json({ success: true, data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.deleteProduct(req.params.id as string);
      res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productService.getCategories();
      res.status(200).json({ success: true, data: { categories } });
    } catch (error) {
      next(error);
    }
  }
}
