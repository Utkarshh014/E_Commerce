import { IPaymentStrategy, PaymentResult } from '../interfaces/IPaymentStrategy';

// ─── Payment Service ────────────────────────────────────────────────
// Strategy Pattern: Accepts any IPaymentStrategy — ZERO changes needed
// to support new payment methods. 
// Dependency Injection: strategy injected via process() method.

export class PaymentService {
  /**
   * Process payment using the given strategy.
   * Polymorphism: works for any class implementing IPaymentStrategy.
   */
  async process(strategy: IPaymentStrategy, amount: number): Promise<PaymentResult> {
    if (amount <= 0) {
      return {
        success: false,
        transactionId: '',
        reason: 'Payment amount must be greater than zero.',
      };
    }

    try {
      console.log(`[PaymentService] Processing $${amount.toFixed(2)} via ${strategy.methodName}...`);
      const result = await strategy.pay(amount);

      if (result.success) {
        console.log(`[PaymentService] ✅ Payment successful. TX: ${result.transactionId}`);
      } else {
        console.log(`[PaymentService] ❌ Payment failed: ${result.reason}`);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown payment error';
      console.error(`[PaymentService] 💥 Payment error: ${message}`);
      return {
        success: false,
        transactionId: '',
        reason: message,
      };
    }
  }
}
