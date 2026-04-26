import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Cart Model ─────────────────────────────────────────────────────
// Composition: Cart HAS-A array of CartItems.
// Encapsulation: State changes only through class methods.

export interface ICartItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
  addItem(item: ICartItem): void;
  removeItem(productId: string): void;
  updateQty(productId: string, quantity: number): void;
  getTotal(): number;
  clearCart(): void;
}

const CartItemSchema = new Schema<ICartItem>(
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

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

// ─── Encapsulation: Controlled methods for cart manipulation ────────

CartSchema.methods.addItem = function (item: ICartItem): void {
  const existingIndex = this.items.findIndex(
    (i: ICartItem) => i.productId.toString() === item.productId.toString()
  );

  if (existingIndex >= 0) {
    this.items[existingIndex].quantity += item.quantity;
  } else {
    this.items.push(item);
  }
};

CartSchema.methods.removeItem = function (productId: string): void {
  this.items = this.items.filter(
    (i: ICartItem) => i.productId.toString() !== productId
  );
};

CartSchema.methods.updateQty = function (productId: string, quantity: number): void {
  const item = this.items.find(
    (i: ICartItem) => i.productId.toString() === productId
  );
  if (item) {
    if (quantity <= 0) {
      this.removeItem(productId);
    } else {
      item.quantity = quantity;
    }
  }
};

CartSchema.methods.getTotal = function (): number {
  return this.items.reduce(
    (total: number, item: ICartItem) => total + item.price * item.quantity,
    0
  );
};

CartSchema.methods.clearCart = function (): void {
  this.items = [];
};

export default mongoose.model<ICart>('Cart', CartSchema);
