import { IDiscountStrategy, DiscountResult } from '../../interfaces/IDiscountStrategy';

// ─── Flat Discount Strategy ─────────────────────────────────────────

export class FlatDiscount implements IDiscountStrategy {
  public readonly discountType = 'Flat';

  private readonly _amount: number;

  constructor(amount: number) {
    if (amount < 0) {
      throw new Error('Flat discount amount cannot be negative');
    }
    this._amount = amount;
  }

  apply(price: number): DiscountResult {
    const discountAmount = Math.min(this._amount, price);
    return {
      originalPrice: price,
      discountedPrice: Math.max(0, price - discountAmount),
      discountAmount,
      description: `$${this._amount.toFixed(2)} off`,
    };
  }
}
