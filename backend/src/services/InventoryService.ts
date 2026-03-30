import Product from '../models/Product';
import { AppError } from '../utils/AppError';

// ─── Inventory Service ──────────────────────────────────────────────
// Stock updates ONLY via controlled methods.
// Uses atomic findOneAndUpdate with $gte condition to prevent race conditions.

interface StockReservation {
  productId: string;
  quantity: number;
}

export class InventoryService {
  /**
   * Atomically reserve stock for multiple products.
   * Uses $gte condition to prevent overselling / race conditions.
   * Returns true if all reservations succeeded, false otherwise.
   */
  async reserveStock(reservations: StockReservation[]): Promise<boolean> {
    const results: Array<{ productId: string; success: boolean }> = [];

    for (const reservation of reservations) {
      // Atomic: only decrements if stock >= quantity
      const updated = await Product.findOneAndUpdate(
        {
          _id: reservation.productId,
          stock: { $gte: reservation.quantity },
        },
        {
          $inc: { stock: -reservation.quantity },
        },
        { new: true }
      );

      results.push({
        productId: reservation.productId,
        success: updated !== null,
      });

      // If any reservation fails, rollback all previous ones
      if (!updated) {
        await this._rollbackReservations(results.filter((r) => r.success).map((r) => ({
          productId: r.productId,
          quantity: reservations.find((res) => res.productId === r.productId)!.quantity,
        })));

        const product = await Product.findById(reservation.productId);
        const available = product ? product.stock : 0;
        throw AppError.badRequest(
          `Insufficient stock for product ${reservation.productId}. Available: ${available}, Requested: ${reservation.quantity}`
        );
      }
    }

    return true;
  }

  /**
   * Release previously reserved stock (e.g., on payment failure).
   */
  async releaseStock(reservations: StockReservation[]): Promise<void> {
    await this._rollbackReservations(reservations);
  }

  /**
   * Check stock levels for a set of products.
   */
  async checkStock(items: StockReservation[]): Promise<{
    allAvailable: boolean;
    unavailable: Array<{ productId: string; requested: number; available: number }>;
  }> {
    const unavailable: Array<{ productId: string; requested: number; available: number }> = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        unavailable.push({
          productId: item.productId,
          requested: item.quantity,
          available: product ? product.stock : 0,
        });
      }
    }

    return {
      allAvailable: unavailable.length === 0,
      unavailable,
    };
  }

  /**
   * Get current stock level for a product.
   */
  async getStockLevel(productId: string): Promise<number> {
    const product = await Product.findById(productId);
    if (!product) throw AppError.notFound('Product not found');
    return product.stock;
  }

  /**
   * Private: Rollback stock reservations.
   */
  private async _rollbackReservations(reservations: StockReservation[]): Promise<void> {
    for (const reservation of reservations) {
      await Product.findByIdAndUpdate(reservation.productId, {
        $inc: { stock: reservation.quantity },
      });
    }
  }
}
