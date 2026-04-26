import mongoose, { Document, Schema, Types } from 'mongoose';
import { OrderStatus } from '../interfaces/IOrderState';

// ─── Order Model ────────────────────────────────────────────────────
// Composition: Order HAS-A array of OrderItems and SubOrders.
// State Pattern: status field corresponds to IOrderState classes.
// Multi-vendor: subOrders isolate each vendor's items + status.

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface ISubOrder {
  vendorId: Types.ObjectId;
  items: IOrderItem[];
  subTotal: number;
  status: OrderStatus;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  subOrders: ISubOrder[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  transactionId: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
);

const SubOrderSchema = new Schema<ISubOrder>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: { type: [OrderItemSchema], required: true },
    subTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Paid',
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: 'Order must have at least one item',
      },
    },
    subOrders: {
      type: [SubOrderSchema],
      default: [],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentMethod: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'subOrders.vendorId': 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);

