import { IDiscountStrategy, DiscountResult } from '../interfaces/IDiscountStrategy';
import { PercentageDiscount } from '../strategies/discounts/PercentageDiscount';
import { FlatDiscount } from '../strategies/discounts/FlatDiscount';
import { CouponDiscount } from '../strategies/discounts/CouponDiscount';

// ─── Discount Service ───────────────────────────────────────────────
// Strategy Pattern: Selects and applies a discount strategy based on input.
// Open/Closed: new discount types can be added without modifying this class.

interface DiscountRequest {
  type: 'percentage' | 'flat' | 'coupon';
  value?: number;
  couponCode?: string;
  maxDiscount?: number;
  minOrderValue?: number;
}

// Predefined coupon database (in production, this would be in MongoDB)
const COUPON_DB: Record<string, { percentage: number; maxDiscount?: number; minOrderValue?: number }> = {
  SAVE10: { percentage: 10, maxDiscount: 50 },
  FLAT20: { percentage: 20, maxDiscount: 100, minOrderValue: 200 },
  WELCOME: { percentage: 15, maxDiscount: 30 },
  MEGA50: { percentage: 50, maxDiscount: 500, minOrderValue: 1000 },
};

export class DiscountService {
  private _strategy: IDiscountStrategy | null = null;

  /** Select the appropriate discount strategy based on request */
  selectStrategy(request: DiscountRequest): IDiscountStrategy {
    switch (request.type) {
      case 'percentage':
        this._strategy = new PercentageDiscount(request.value || 0);
        break;
      case 'flat':
        this._strategy = new FlatDiscount(request.value || 0);
        break;
      case 'coupon': {
        const couponData = COUPON_DB[request.couponCode?.toUpperCase() || ''];
        if (!couponData) {
          throw new Error(`Invalid coupon code: ${request.couponCode}`);
        }
        this._strategy = new CouponDiscount({
          code: request.couponCode!.toUpperCase(),
          percentage: couponData.percentage,
          maxDiscount: couponData.maxDiscount,
          minOrderValue: couponData.minOrderValue,
        });
        break;
      }
      default:
        throw new Error(`Unknown discount type: ${request.type}`);
    }

    return this._strategy;
  }

  /** Apply the currently selected strategy to a price */
  applyDiscount(price: number, request: DiscountRequest): DiscountResult {
    const strategy = this.selectStrategy(request);
    return strategy.apply(price);
  }

  /** Get available coupons (for frontend display) */
  getAvailableCoupons(): Array<{ code: string; description: string }> {
    return Object.entries(COUPON_DB).map(([code, config]) => ({
      code,
      description: `${config.percentage}% off${
        config.maxDiscount ? ` (max $${config.maxDiscount})` : ''
      }${config.minOrderValue ? ` | Min order: $${config.minOrderValue}` : ''}`,
    }));
  }
}
