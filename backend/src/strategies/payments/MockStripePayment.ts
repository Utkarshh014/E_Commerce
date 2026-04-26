import { IPaymentStrategy, PaymentResult } from '../../interfaces/IPaymentStrategy';

export class MockStripePayment implements IPaymentStrategy {
  readonly methodName = 'stripe_mock';
  private clientSecret: string;

  constructor(clientSecret: string) {
    this.clientSecret = clientSecret;
  }

  async pay(amount: number): Promise<PaymentResult> {
    // In a real Stripe implementation, we'd confirm the PaymentIntent
    // or rely on a webhook. For mock, we'll just return success if the
    // clientSecret isn't empty.
    if (!this.clientSecret) {
      return {
        success: false,
        transactionId: '',
        reason: 'Missing Stripe Client Secret',
      };
    }

    return {
      success: true,
      transactionId: `pi_mock_${Date.now()}`,
    };
  }
}
