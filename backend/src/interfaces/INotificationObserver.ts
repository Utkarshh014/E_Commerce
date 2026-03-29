// ─── Notification Observer Interface ────────────────────────────────
// Observer Pattern: All notification channels implement this interface.
// Adding a new channel (SMS, Push) requires ZERO changes to existing code.

export interface NotificationEvent {
  type: 'ORDER_PLACED' | 'PAYMENT_SUCCESS' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED';
  userId: string;
  orderId: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface INotificationObserver {
  readonly channelName: string;
  notify(event: NotificationEvent): Promise<void>;
}
