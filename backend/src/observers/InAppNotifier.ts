import { INotificationObserver, NotificationEvent } from '../interfaces/INotificationObserver';
import NotificationModel from '../models/Notification';

// ─── In-App Notifier ────────────────────────────────────────────────
// Observer Pattern: Stores notifications in the database.

export class InAppNotifier implements INotificationObserver {
  public readonly channelName = 'InApp';

  async notify(event: NotificationEvent): Promise<void> {
    await NotificationModel.create({
      userId: event.userId,
      orderId: event.orderId,
      type: event.type,
      message: event.message,
      metadata: event.metadata ?? {},
      read: false,
    });

    console.log(`🔔 [IN-APP] Notification stored for user ${event.userId}: ${event.type}`);
  }
}
