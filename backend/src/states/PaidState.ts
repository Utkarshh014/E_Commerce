import { IOrderState, OrderStatus } from '../interfaces/IOrderState';

// ─── Paid State ─────────────────────────────────────────────────────
// State Pattern: Order has been paid, awaiting shipment.

export class PaidState implements IOrderState {
  public readonly status: OrderStatus = 'Paid';

  getValidTransitions(): OrderStatus[] {
    return ['Shipped', 'Cancelled'];
  }

  canTransitionTo(nextState: IOrderState): boolean {
    return this.getValidTransitions().includes(nextState.status);
  }

  async onEnter(orderId: string): Promise<void> {
    console.log(`💳 Order ${orderId} is now PAID — preparing for shipment.`);
  }

  async onExit(orderId: string): Promise<void> {
    console.log(`💳 Order ${orderId} leaving PAID state.`);
  }
}