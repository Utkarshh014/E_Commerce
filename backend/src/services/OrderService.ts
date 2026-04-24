import Order, { IOrder, ISubOrder } from '../models/Order';
import Product from '../models/Product';
import { IOrderState, OrderStatus } from '../interfaces/IOrderState';
import { IPaymentStrategy } from '../interfaces/IPaymentStrategy';
import { NotificationService } from './NotificationService';
import { PaymentService } from './PaymentService';
import { InventoryService } from './InventoryService';
import { DiscountService } from './DiscountService';
import { CartService } from './CartService';
import { PendingState } from '../states/PendingState';
import { PaidState } from '../states/PaidState';
import { ShippedState } from '../states/ShippedState';
import { DeliveredState } from '../states/DeliveredState';
import { CancelledState } from '../states/CancelledState';
import { AppError } from '../utils/AppError';

// ─── Order Service ──────────────────────────────────────────────────
// State Pattern: Order lifecycle managed through IOrderState classes.
// Observer Pattern: Emits events to NotificationService.
// Composition: OrderService HAS-A NotificationService, PaymentService, etc.
// Dependency Injection: All collaborators received via constructor.

interface PlaceOrderData {
  userId: string;
  paymentStrategy: IPaymentStrategy;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  discountRequest?: {
    type: 'percentage' | 'flat' | 'coupon';
    value?: number;
    couponCode?: string;
  };
}

// Map status strings to state classes
const STATE_MAP: Record<OrderStatus, () => IOrderState> = {
  Pending: () => new PendingState(),
  Paid: () => new PaidState(),
  Shipped: () => new ShippedState(),
  Delivered: () => new DeliveredState(),
  Cancelled: () => new CancelledState(),
};

export class OrderService {
  // Composition + Dependency Injection
  private readonly _notificationService: NotificationService;
  private readonly _paymentService: PaymentService;
  private readonly _inventoryService: InventoryService;
  private readonly _discountService: DiscountService;
  private readonly _cartService: CartService;

  constructor(
    notificationService: NotificationService,
    paymentService: PaymentService,
    inventoryService: InventoryService,
    discountService: DiscountService,
    cartService: CartService
  ) {
    this._notificationService = notificationService;
    this._paymentService = paymentService;
    this._inventoryService = inventoryService;
    this._discountService = discountService;
    this._cartService = cartService;
  }

  /**
   * Place a new order — full checkout flow:
   * 1. Get cart items
   * 2. Check stock
   * 3. Apply discount (if any)
   * 4. Reserve inventory (atomic)
   * 5. Process payment
   * 6. Create order
   * 7. Clear cart
   * 8. Notify observers
   */
  async placeOrder(data: PlaceOrderData): Promise<IOrder> {
    // 1. Get cart
    const cart = await this._cartService.getCart(data.userId);
    if (!cart.items || cart.items.length === 0) {
      throw AppError.badRequest('Cart is empty');
    }

    // 1.5 Sync cart items with the latest prices from the database
    const cartProductIds = cart.items.map((i) => i.productId.toString());
    const freshProducts = await Product.find({ _id: { $in: cartProductIds } }).select('price name imageUrl vendorId');
    const productMap = new Map<string, any>();
    freshProducts.forEach((p) => productMap.set(p._id.toString(), p));

    cart.items.forEach((item) => {
      const p = productMap.get(item.productId.toString());
      if (p) {
        item.price = p.price;
        item.name = p.name;
        item.imageUrl = p.imageUrl;
      }
    });

    // 2. Check stock BEFORE payment
    const stockCheck = await this._inventoryService.checkStock(
      cart.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
      }))
    );

    if (!stockCheck.allAvailable) {
      const details = stockCheck.unavailable
        .map((u) => `Product ${u.productId}: requested ${u.requested}, available ${u.available}`)
        .join('; ');
      throw AppError.badRequest(`Insufficient stock: ${details}`);
    }

    // 3. Calculate total and apply discount
    const totalAmount = cart.getTotal();
    let discountAmount = 0;
    let finalAmount = totalAmount;

    if (data.discountRequest) {
      try {
        const discountResult = this._discountService.applyDiscount(
          totalAmount,
          data.discountRequest
        );
        discountAmount = discountResult.discountAmount;
        finalAmount = discountResult.discountedPrice;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Invalid discount';
        throw AppError.badRequest(msg);
      }
    }

    // 4. Reserve inventory (atomic with race condition protection)
    await this._inventoryService.reserveStock(
      cart.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
      }))
    );

    // 5. Process payment
    const paymentResult = await this._paymentService.process(
      data.paymentStrategy,
      finalAmount
    );

    // If payment fails → release inventory, order stays non-existent
    if (!paymentResult.success) {
      await this._inventoryService.releaseStock(
        cart.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
        }))
      );
      throw AppError.badRequest(`Payment failed: ${paymentResult.reason}`);
    }

    // 6. Build subOrders by grouping cart items by vendorId
    const productIds = cart.items.map((i) => i.productId.toString());
    const products = await Product.find({ _id: { $in: productIds } }).select('vendorId');
    const vendorMap = new Map<string, string>();
    products.forEach((p) => vendorMap.set(p._id.toString(), p.vendorId.toString()));

    // Group items by vendor
    const subOrderMap = new Map<string, typeof cart.items>();
    cart.items.forEach((item) => {
      const vid = vendorMap.get(item.productId.toString()) || 'unknown';
      if (!subOrderMap.has(vid)) subOrderMap.set(vid, []);
      subOrderMap.get(vid)!.push(item);
    });

    const subOrders: ISubOrder[] = [];
    subOrderMap.forEach((items, vendorId) => {
      let subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      
      // Distribute order-level discount proportionally to this subOrder
      if (totalAmount > 0 && discountAmount > 0) {
        const discountShare = (subTotal / totalAmount) * discountAmount;
        subTotal = Math.max(0, subTotal - discountShare);
      }

      subOrders.push({ vendorId: vendorId as any, items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.imageUrl,
      })), subTotal, status: 'Paid' });
    });

    // 7. Create order in Paid state (payment succeeded)
    const order = await Order.create({
      userId: data.userId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
      subOrders,
      totalAmount,
      discountAmount,
      finalAmount,
      status: 'Paid',
      paymentMethod: data.paymentStrategy.methodName,
      transactionId: paymentResult.transactionId,
      shippingAddress: data.shippingAddress,
    });

    // Execute state enter hook
    const paidState = new PaidState();
    await paidState.onEnter((order._id as any).toString());

    // 8. Clear cart
    await this._cartService.clearCart(data.userId);

    // 9. Emit notifications (Observer Pattern)
    const orderId = (order._id as any).toString();

    await this._notificationService.emit(
      'ORDER_PLACED',
      data.userId,
      orderId,
      `Your order #${orderId.slice(-8)} has been placed successfully! Total: $${finalAmount.toFixed(2)}`,
      { totalAmount, finalAmount, paymentMethod: data.paymentStrategy.methodName }
    );

    await this._notificationService.emit(
      'PAYMENT_SUCCESS',
      data.userId,
      orderId,
      `Payment of $${finalAmount.toFixed(2)} via ${data.paymentStrategy.methodName} was successful. TX: ${paymentResult.transactionId}`,
      { transactionId: paymentResult.transactionId }
    );

    return order;
  }

  /**
   * Transition order to a new state — State Pattern.
   */
  async transitionTo(orderId: string, nextStatus: OrderStatus): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    const currentState = this._getStateInstance(order.status);
    const nextState = this._getStateInstance(nextStatus);

    if (!currentState.canTransitionTo(nextState)) {
      throw AppError.badRequest(
        `Cannot transition from ${currentState.status} to ${nextState.status}. Valid transitions: ${currentState.getValidTransitions().join(', ')}`
      );
    }

    // C1: Snapshot status BEFORE mutation so refund guard uses the correct prior state
    const prevStatus = order.status;

    // Execute state hooks
    await currentState.onExit(orderId);
    await nextState.onEnter(orderId);

    order.status = nextStatus;
    await order.save();

    // Notify on shipped/delivered/cancelled
    if (nextStatus === 'Shipped') {
      await this._notificationService.emit(
        'ORDER_SHIPPED',
        order.userId.toString(),
        orderId,
        `Your order #${orderId.slice(-8)} has been shipped!`
      );
    } else if (nextStatus === 'Delivered') {
      await this._notificationService.emit(
        'ORDER_DELIVERED',
        order.userId.toString(),
        orderId,
        `Your order #${orderId.slice(-8)} has been delivered!`
      );
    } else if (nextStatus === 'Cancelled') {
      // Use prevStatus — order.status is now 'Cancelled'
      if (prevStatus === 'Paid' || prevStatus === 'Shipped') {
        console.log(`[OrderService] Mock Refunding transaction ${order.transactionId}`);
      }
      await this._inventoryService.releaseStock(
        order.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
        }))
      );
      await this._notificationService.emit(
        'ORDER_CANCELLED',
        order.userId.toString(),
        orderId,
        `Your order #${orderId.slice(-8)} has been cancelled and refunded.`
      );
    }

    return order;
  }

  async getOrderById(orderId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    return order;
  }

  async getUserOrders(userId: string): Promise<IOrder[]> {
    return Order.find({ userId }).sort({ createdAt: -1 });
  }

  async getAllOrders(): Promise<IOrder[]> {
    return Order.find().sort({ createdAt: -1 }).populate('userId', 'name email');
  }

  async getVendorOrders(vendorId: string): Promise<{
    orderId: string;
    customerId: string;
    createdAt: Date;
    paymentMethod: string;
    shippingAddress: IOrder['shippingAddress'];
    subOrder: ISubOrder;
  }[]> {
    // True isolation: only expose this vendor's subOrder, not the full order
    const orders = await Order.find({ 'subOrders.vendorId': vendorId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    return orders
      .map((order) => {
        const sub = order.subOrders.find((s) => s.vendorId.toString() === vendorId);
        if (!sub) return null;
        return {
          orderId: (order._id as any).toString(),
          customerId: (order.userId as any),
          createdAt: order.createdAt,
          paymentMethod: order.paymentMethod,
          shippingAddress: order.shippingAddress,
          subOrder: sub,
        };
      })
      .filter(Boolean) as any[];
  }

  /**
   * Update a single vendor's subOrder status.
   * Auto-syncs top-level order.status when all subOrders reach a terminal state.
   */
  async updateSubOrderStatus(orderId: string, vendorId: string, newStatus: OrderStatus): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');

    const subIdx = order.subOrders.findIndex((s) => s.vendorId.toString() === vendorId);
    if (subIdx === -1) throw AppError.forbidden('You do not have a subOrder in this order');

    const currentSubStatus = order.subOrders[subIdx].status;
    const currentState = this._getStateInstance(currentSubStatus);
    const nextState = this._getStateInstance(newStatus);

    if (!currentState.canTransitionTo(nextState)) {
      throw AppError.badRequest(
        `Cannot transition subOrder from ${currentSubStatus} to ${newStatus}. Valid: ${currentState.getValidTransitions().join(', ')}`
      );
    }

    order.subOrders[subIdx].status = newStatus;

    // Auto-sync top-level status based on all subOrder statuses
    const allStatuses = order.subOrders.map((s) => s.status);
    const allDelivered = allStatuses.every((s) => s === 'Delivered');
    const allCancelled = allStatuses.every((s) => s === 'Cancelled');
    // L1 fix: mixed terminal (some Delivered, some Cancelled) → keep as Shipped, not Delivered
    const allTerminal = allStatuses.every((s) => s === 'Delivered' || s === 'Cancelled');

    if (allDelivered) order.status = 'Delivered';
    else if (allCancelled) order.status = 'Cancelled';
    else if (allTerminal) order.status = 'Shipped'; // mixed: partial delivery, partial cancel
    else if (newStatus === 'Shipped') order.status = 'Shipped';

    await order.save();

    // Release stock and mock refund if this subOrder was cancelled
    if (newStatus === 'Cancelled') {
      console.log(`[OrderService] Mock Partial Refund for transaction ${order.transactionId}`);
      await this._inventoryService.releaseStock(
        order.subOrders[subIdx].items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
        }))
      );
      await this._notificationService.emit(
        'ORDER_CANCELLED',
        order.userId.toString(),
        orderId,
        `Part of your order #${orderId.slice(-8)} has been cancelled and refunded.`
      );
    }

    // Notify customer on shipped/delivered
    const ordIdStr = (order._id as any).toString();
    if (newStatus === 'Shipped') {
      await this._notificationService.emit(
        'ORDER_SHIPPED', order.userId.toString(), ordIdStr,
        `Part of your order #${ordIdStr.slice(-8)} has been shipped!`
      );
    } else if (newStatus === 'Delivered') {
      await this._notificationService.emit(
        'ORDER_DELIVERED', order.userId.toString(), ordIdStr,
        `Part of your order #${ordIdStr.slice(-8)} has been delivered!`
      );
    }

    return order;
  }

  private _getStateInstance(status: OrderStatus): IOrderState {
    const factory = STATE_MAP[status];
    if (!factory) {
      throw AppError.internal(`Unknown order status: ${status}`);
    }
    return factory();
  }
}
