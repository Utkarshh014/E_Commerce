import { IOrderState, OrderStatus } from '../interfaces/IOrderState';

// ─── Shipped State ──────────────────────────────────────────────────
// State Pattern: Order has been shipped, in transit.

export class ShippedState implements IOrderState {
  public readonly status: OrderStatus = 'Shipped';

  getValidTransitions(): OrderStatus[] {
    return ['Delivered'];
  }

  canTransitionTo(nextState: IOrderState): boolean {
    return this.getValidTransitions().includes(nextState.status);
  }

  async onEnter(orderId: string): Promise<void> {
    console.log(`🚚 Order ${orderId} is now SHIPPED — in transit to customer.`);
  }

  async onExit(orderId: string): Promise<void> {
    console.log(`🚚 Order ${orderId} leaving SHIPPED state.`);
  }
}
