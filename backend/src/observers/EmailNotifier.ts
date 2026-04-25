import { INotificationObserver, NotificationEvent } from '../interfaces/INotificationObserver';
import nodemailer from 'nodemailer';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

// ─── Email Notifier ─────────────────────────────────────────────────
// Observer Pattern: Logs emails to console and sends via Nodemailer.

export class EmailNotifier implements INotificationObserver {
  public readonly channelName = 'Email';
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
      },
    });
  }

  async notify(event: NotificationEvent): Promise<void> {
    console.log(`\n📧 [EMAIL NOTIFICATION]`);
    console.log(`   To: User ${event.userId}`);
    console.log(`   Subject: ${event.type.replace(/_/g, ' ')}`);
    console.log(`   Body: ${event.message}`);
    
    try {
      const user = await User.findById(event.userId);
      const email = user ? user.email : 'customer@example.com';

      await this.transporter.sendMail({
        from: '"Shop Smart" <noreply@shopsmart.com>',
        to: email,
        subject: event.type.replace(/_/g, ' '),
        text: `${event.message}\nOrder ID: ${event.orderId}`,
      });
      console.log(`   ✅ Email sent successfully to ${email}`);
    } catch (error) {
      console.error(`   ❌ Failed to send email:`, error);
    }
  }
}
