import { IPaymentStrategy, PaymentResult } from '../../interfaces/IPaymentStrategy';
import { v4Fallback } from '../../utils/idGenerator';

// ─── UPI Payment Strategy ───────────────────────────────────────────
// Concrete Strategy: Mocked UPI payment processing.

export class UPIPayment implements IPaymentStrategy {
  public readonly methodName = 'UPI';

  private readonly _upiId: string;

  constructor(upiId: string) {
    this._upiId = upiId;
  }

  async pay(amount: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock: reject if UPI ID contains "fail"
    if (this._upiId.toLowerCase().includes('fail')) {
      return {
        success: false,
        transactionId: '',
        reason: 'UPI transaction failed — timeout from bank server.',
      };
    }

    console.log(`[UPI] Debited ₹${amount.toFixed(2)} from UPI ID: ${this._upiId}`);

    return {
      success: true,
      transactionId: `UPI-${v4Fallback()}`,
    };
  }
}
