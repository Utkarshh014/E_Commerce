import { IOrderState, OrderStatus } from '../interfaces/IOrderState';

// ─── Delivered State ────────────────────────────────────────────────
// State Pattern: Order has been delivered — terminal state.

export class DeliveredState implements IOrderState {
  public readonly status: OrderStatus = 'Delivered';

  getValidTransitions(): OrderStatus[] {
    return []; // Terminal state — no further transitions
  }

  canTransitionTo(_nextState: IOrderState): boolean {
    return false; // Cannot transition from Delivered
  }

  async onEnter(orderId: string): Promise<void> {
    console.log(`✅ Order ${orderId} has been DELIVERED successfully.`);
  }

  async onExit(_orderId: string): Promise<void> {
    // Terminal state — this should never be called
    throw new Error('Cannot exit Delivered state — it is a terminal state.');
  }
}
