import { IOrderState, OrderStatus } from '../interfaces/IOrderState';

// ─── Pending State ──────────────────────────────────────────────────
// State Pattern: Initial state when an order is created.

export class PendingState implements IOrderState {
  public readonly status: OrderStatus = 'Pending';

  getValidTransitions(): OrderStatus[] {
    return ['Paid', 'Cancelled'];
  }

  canTransitionTo(nextState: IOrderState): boolean {
    return this.getValidTransitions().includes(nextState.status);
  }

  async onEnter(orderId: string): Promise<void> {
    console.log(`📋 Order ${orderId} is now PENDING — awaiting payment.`);
  }

  async onExit(orderId: string): Promise<void> {
    console.log(`📋 Order ${orderId} leaving PENDING state.`);
  }
}