import { IDiscountStrategy, DiscountResult } from '../../interfaces/IDiscountStrategy';

// ─── Percentage Discount Strategy ───────────────────────────────────

export class PercentageDiscount implements IDiscountStrategy {
  public readonly discountType = 'Percentage';

  private readonly _percentage: number;

  constructor(percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    this._percentage = percentage;
  }

  apply(price: number): DiscountResult {
    const discountAmount = (price * this._percentage) / 100;
    return {
      originalPrice: price,
      discountedPrice: Math.max(0, price - discountAmount),
      discountAmount,
      description: `${this._percentage}% off`,
    };
  }
}
