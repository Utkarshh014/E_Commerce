// ─── Discount Strategy Interface ────────────────────────────────────
// Strategy Pattern: All discount types implement this interface.
// Adding a new discount type requires ZERO changes to existing code.

export interface DiscountResult {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  description: string;
}

export interface IDiscountStrategy {
  readonly discountType: string;
  apply(price: number): DiscountResult;
}
