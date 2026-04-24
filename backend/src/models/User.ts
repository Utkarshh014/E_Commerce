import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// ─── User Model ─────────────────────────────────────────────────────
// Encapsulation: Password hashing is inside the class method, not controller.

export type UserRole = 'customer' | 'admin' | 'vendor';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isApprovedVendor?: boolean;
  vendorName?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Record<string, unknown>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'vendor'],
      default: 'customer',
    },
    isApprovedVendor: {
      type: Boolean,
      default: false,
    },
    vendorName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Encapsulation: Password hashing inside model pre-save hook ─────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Encapsulation: Password comparison as instance method ──────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Encapsulation: Safe JSON representation ────────────────────────
UserSchema.methods.toSafeObject = function (): Record<string, unknown> {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isApprovedVendor: this.isApprovedVendor,
    vendorName: this.vendorName,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model<IUser>('User', UserSchema);