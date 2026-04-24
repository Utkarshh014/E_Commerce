import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AdminService } from '../services/AdminService';

const adminService = new AdminService();

export class AdminController {
  static async getAnalytics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await adminService.getAnalytics();
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const users = await adminService.getAllUsers(role);
      res.status(200).json({ success: true, data: { users } });
    } catch (error) {
      next(error);
    }
  }

  static async updateVendorStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isApprovedVendor } = req.body;
      if (typeof isApprovedVendor !== 'boolean') {
        res.status(400).json({ success: false, message: 'isApprovedVendor must be a boolean' });
        return;
      }

      const user = await adminService.updateVendorStatus(req.params.id as string, isApprovedVendor);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deleteProduct(req.params.id as string);
      res.status(200).json({ success: true, message: 'Product deleted by admin' });
    } catch (error) {
      next(error);
    }
  }
}
