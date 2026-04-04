import { INotificationObserver, NotificationEvent } from '../interfaces/INotificationObserver';

// ─── Email Notifier ─────────────────────────────────────────────────
// Observer Pattern: Logs emails to console (mocked).

export class EmailNotifier implements INotificationObserver {
  public readonly channelName = 'Email';

  async notify(event: NotificationEvent): Promise<void> {
    console.log(`\n📧 [EMAIL NOTIFICATION]`);
    console.log(`   To: User ${event.userId}`);
    console.log(`   Subject: ${event.type.replace(/_/g, ' ')}`);
    console.log(`   Body: ${event.message}`);
    console.log(`   Order: ${event.orderId}`);
    if (event.metadata) {
      console.log(`   Metadata: ${JSON.stringify(event.metadata)}`);
    }
    console.log('');
  }
}
