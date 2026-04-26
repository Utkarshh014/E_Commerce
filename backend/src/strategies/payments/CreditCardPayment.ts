import { IPaymentStrategy, PaymentResult } from '../../interfaces/IPaymentStrategy';
import { v4Fallback } from '../../utils/idGenerator';

// ─── CreditCard Payment Strategy ────────────────────────────────────
// Concrete Strategy: Mocked credit card payment processing.

export class CreditCardPayment implements IPaymentStrategy {
  public readonly methodName = 'CreditCard';

  private readonly _cardNumber: string;
  private readonly _expiryDate: string;

  constructor(cardNumber: string, expiryDate: string) {
    this._cardNumber = cardNumber;
    this._expiryDate = expiryDate;
  }

  async pay(amount: number): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock: reject if card number ends with 0000 (for testing failure)
    if (this._cardNumber.endsWith('0000')) {
      return {
        success: false,
        transactionId: '',
        reason: 'Credit card declined — insufficient funds.',
      };
    }

    const maskedCard = this._cardNumber.slice(-4).padStart(this._cardNumber.length, '*');
    console.log(
      `[CreditCard] Charged $${amount.toFixed(2)} to card ${maskedCard} (exp: ${this._expiryDate})`
    );

    return {
      success: true,
      transactionId: `CC-${v4Fallback()}`,
    };
  }
}
