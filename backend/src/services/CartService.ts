import Cart, { ICart, ICartItem } from '../models/Cart';
import Product from '../models/Product';
import { AppError } from '../utils/AppError';

// ─── Cart Service ───────────────────────────────────────────────────
// Encapsulation: Cart state changes only through controlled service methods.
// Composition: Cart HAS-A array of CartItems.

export class CartService {
  async getCart(userId: string): Promise<ICart> {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<ICart> {
    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingItem = cart.items.find(i => i.productId.toString() === productId);
    const existingQuantity = existingItem ? existingItem.quantity : 0;
    
    if (product.stock < existingQuantity + quantity) {
      throw AppError.badRequest(`Insufficient stock. Available: ${product.stock}, In Cart: ${existingQuantity}`);
    }

    const cartItem: ICartItem = {
      productId: product._id as any,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
    };

    cart.addItem(cartItem);
    await cart.save();
    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    cart.removeItem(productId);
    await cart.save();
    return cart;
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    if (quantity > 0) {
      const product = await Product.findById(productId);
      if (product && product.stock < quantity) {
        throw AppError.badRequest(`Insufficient stock. Available: ${product.stock}`);
      }
    }

    cart.updateQty(productId, quantity);
    await cart.save();
    return cart;
  }

  async clearCart(userId: string): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.notFound('Cart not found');
    }

    cart.clearCart();
    await cart.save();
    return cart;
  }

  async getTotal(userId: string): Promise<number> {
    const cart = await Cart.findOne({ userId });
    if (!cart) return 0;
    return cart.getTotal();
  }
}
