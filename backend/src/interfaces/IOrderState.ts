// ─── Order State Interface ──────────────────────────────────────────
// State Pattern: Each order status is a class implementing this interface.
// Adding a new state requires ZERO changes to existing state classes.

export type OrderStatus = 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface IOrderState {
  readonly status: OrderStatus;
  
  /** Returns the list of valid states this state can transition to */
  getValidTransitions(): OrderStatus[];
  
  /** Validates if the transition to the next state is allowed */
  canTransitionTo(nextState: IOrderState): boolean;
  
  /** Hook called when entering this state */
  onEnter(orderId: string): Promise<void>;
  
  /** Hook called when exiting this state */
  onExit(orderId: string): Promise<void>;
}
