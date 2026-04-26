import { INotificationObserver, NotificationEvent } from '../interfaces/INotificationObserver';

// ─── Notification Service ───────────────────────────────────────────
// Observer Pattern: Maintains list of observers and notifies all on events.
// Dependency Injection: Observers are injected via constructor / register method.

export class NotificationService {
  private _observers: INotificationObserver[] = [];

  constructor(observers?: INotificationObserver[]) {
    if (observers) {
      this._observers = [...observers];
    }
  }

  /** Register a new notification observer */
  registerObserver(observer: INotificationObserver): void {
    this._observers.push(observer);
  }

  /** Unregister an observer by channel name */
  unregisterObserver(channelName: string): void {
    this._observers = this._observers.filter(
      (o) => o.channelName !== channelName
    );
  }

  /** Notify all registered observers — Observer Pattern */
  async notifyAll(event: NotificationEvent): Promise<void> {
    const promises = this._observers.map((observer) =>
      observer.notify(event).catch((error) => {
        console.error(
          `[NotificationService] Error in ${observer.channelName}:`,
          error
        );
      })
    );

    await Promise.allSettled(promises);
  }

  /** Emit helper — convenience wrapper for notifyAll */
  async emit(
    type: NotificationEvent['type'],
    userId: string,
    orderId: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.notifyAll({
      type,
      userId,
      orderId,
      message,
      metadata,
    });
  }

  /** Get list of registered channel names */
  getRegisteredChannels(): string[] {
    return this._observers.map((o) => o.channelName);
  }
}
