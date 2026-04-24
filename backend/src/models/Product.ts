import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Product Model ──────────────────────────────────────────────────
// Uses Mongoose discriminators for PhysicalProduct / DigitalProduct.
// Polymorphism: same collection, different shapes based on productType.

export interface IProduct extends Document {
  name: string;
  price: number;
  categoryId: Types.ObjectId;
  vendorId: Types.ObjectId;
  averageRating: number;
  numReviews: number;
  stock: number;
  description: string;
  imageUrl: string;
  imageUrls: string[];
  productType: 'physical' | 'digital';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPhysicalProduct extends IProduct {
  weight: number;
  dimensions: { length: number; width: number; height: number };
}

export interface IDigitalProduct extends IProduct {
  downloadUrl: string;
  licenseKey: string;
}

// ─── Base Product Schema ────────────────────────────────────────────
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor is required'],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    productType: {
      type: String,
      required: true,
      enum: ['physical', 'digital'],
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'productType',
  }
);

// Indexes for efficient filtering
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model<IProduct>('Product', ProductSchema);

// ─── Physical Product Discriminator ─────────────────────────────────
const PhysicalProductSchema = new Schema<IPhysicalProduct>({
  weight: {
    type: Number,
    required: [true, 'Weight is required for physical products'],
    min: 0,
  },
  dimensions: {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
  },
});

// ─── Digital Product Discriminator ──────────────────────────────────
const DigitalProductSchema = new Schema<IDigitalProduct>({
  downloadUrl: {
    type: String,
    required: [true, 'Download URL is required for digital products'],
  },
  licenseKey: {
    type: String,
    required: [true, 'License key is required for digital products'],
  },
});

export const PhysicalProduct = Product.discriminator<IPhysicalProduct>(
  'physical',
  PhysicalProductSchema
);

export const DigitalProduct = Product.discriminator<IDigitalProduct>(
  'digital',
  DigitalProductSchema
);

export default Product;