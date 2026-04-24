import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Notification from '../models/Notification';

// ─── Notification Controller ────────────────────────────────────────

export class NotificationController {
  static async getMyNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await Notification.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(50);
      res.status(200).json({ success: true, data: { notifications } });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // S3: Filter by both _id AND userId to prevent cross-user notification manipulation
      await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { read: true }
      );
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
