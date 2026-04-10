import { IOrderState, OrderStatus } from '../interfaces/IOrderState';

// ─── Cancelled State ────────────────────────────────────────────────
// State Pattern: Order has been cancelled — terminal state.

export class CancelledState implements IOrderState {
  public readonly status: OrderStatus = 'Cancelled';

  getValidTransitions(): OrderStatus[] {
    return []; // Terminal state
  }

  canTransitionTo(_nextState: IOrderState): boolean {
    return false;
  }

  async onEnter(orderId: string): Promise<void> {
    console.log(`❌ Order ${orderId} has been CANCELLED.`);
  }

  async onExit(_orderId: string): Promise<void> {
    throw new Error('Cannot exit Cancelled state — it is a terminal state.');
  }
}
