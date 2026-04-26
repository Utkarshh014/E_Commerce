import { IPaymentStrategy, PaymentResult } from '../../interfaces/IPaymentStrategy';
import { v4Fallback } from '../../utils/idGenerator';

// ─── Wallet Payment Strategy ────────────────────────────────────────
// Concrete Strategy: Mocked wallet payment processing.

export class WalletPayment implements IPaymentStrategy {
  public readonly methodName = 'Wallet';

  private _balance: number;

  constructor(initialBalance: number = 1000) {
    this._balance = initialBalance;
  }

  get balance(): number {
    return this._balance;
  }

  async pay(amount: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (amount > this._balance) {
      return {
        success: false,
        transactionId: '',
        reason: `Wallet balance insufficient. Available: $${this._balance.toFixed(2)}, Required: $${amount.toFixed(2)}`,
      };
    }

    this._balance -= amount;
    console.log(
      `[Wallet] Deducted $${amount.toFixed(2)} from wallet. Remaining: $${this._balance.toFixed(2)}`
    );

    return {
      success: true,
      transactionId: `WLT-${v4Fallback()}`,
    };
  }
}
