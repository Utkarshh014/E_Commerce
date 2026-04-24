import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Notification Model ─────────────────────────────────────────────
// Stores in-app notifications per user.

export interface INotification extends Document {
  userId: Types.ObjectId | string;
  orderId: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: { type: String, default: '' },
    type: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);