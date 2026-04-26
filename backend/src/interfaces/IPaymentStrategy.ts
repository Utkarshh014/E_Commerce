// ─── Payment Strategy Interface ─────────────────────────────────────
// Strategy Pattern: All payment methods implement this interface.
// Adding a new payment method requires ZERO changes to existing code.

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  reason?: string;
}

export interface IPaymentStrategy {
  readonly methodName: string;
  pay(amount: number): Promise<PaymentResult>;
}
