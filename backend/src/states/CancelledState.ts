import { IOrderState, OrderStatus } from '../interfaces/IOrderState';
import { AppError } from '../utils/AppError';

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
    // C2: Use AppError so the global handler returns a structured 400, not a raw 500
    throw AppError.badRequest('Order is already cancelled — it is a terminal state.');
  }
}
