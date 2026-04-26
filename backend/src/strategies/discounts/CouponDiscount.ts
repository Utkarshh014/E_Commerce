import { IDiscountStrategy, DiscountResult } from '../../interfaces/IDiscountStrategy';

// ─── Coupon Discount Strategy ───────────────────────────────────────
// Validates coupon codes and applies the associated discount.

interface CouponConfig {
  code: string;
  percentage: number;
  maxDiscount?: number;
  minOrderValue?: number;
}

export class CouponDiscount implements IDiscountStrategy {
  public readonly discountType = 'Coupon';

  private readonly _config: CouponConfig;

  constructor(config: CouponConfig) {
    this._config = config;
  }

  get couponCode(): string {
    return this._config.code;
  }

  apply(price: number): DiscountResult {
    if (this._config.minOrderValue && price < this._config.minOrderValue) {
      return {
        originalPrice: price,
        discountedPrice: price,
        discountAmount: 0,
        description: `Coupon ${this._config.code} requires minimum order of $${this._config.minOrderValue.toFixed(2)}`,
      };
    }

    let discountAmount = (price * this._config.percentage) / 100;

    if (this._config.maxDiscount) {
      discountAmount = Math.min(discountAmount, this._config.maxDiscount);
    }

    return {
      originalPrice: price,
      discountedPrice: Math.max(0, price - discountAmount),
      discountAmount,
      description: `Coupon ${this._config.code}: ${this._config.percentage}% off${
        this._config.maxDiscount ? ` (max $${this._config.maxDiscount.toFixed(2)})` : ''
      }`,
    };
  }
}
