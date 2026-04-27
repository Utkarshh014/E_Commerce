import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import Product from '../models/Product';
import User from '../models/User';

// ─── Auth Middleware ─────────────────────────────────────────────────
// Verifies JWT and attaches user info to request.

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  isApprovedVendor?: boolean;
}

const authService = new AuthService();

export const authGuard = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.isApprovedVendor = (decoded as any).isApprovedVendor;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ─── Role Guard ─────────────────────────────────────────────────────
// Restricts access based on user role.

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
};

export const requireApprovedVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.userRole === 'admin') return next();
    
    if (req.userRole !== 'vendor') {
      res.status(403).json({ success: false, message: 'Access denied. Vendor role required.' });
      return;
    }

    // Live check from DB to avoid stale JWT issues
    const user = await User.findById(req.userId).select('isApprovedVendor');
    if (!user || !user.isApprovedVendor) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Vendor approval required.',
      });
      return;
    }
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Approval check failed' });
  }
};

// ─── Product Ownership Guard ────────────────────────────────────────────────────
// Ensures the authenticated vendor owns the product being modified.
// Admins bypass this check.
export const requireProductOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.userRole === 'admin') return next();
    const product = await Product.findById(req.params.id).select('vendorId');
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    if (product.vendorId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'You do not own this product' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ success: false, message: 'Ownership check failed' });
  }
};
