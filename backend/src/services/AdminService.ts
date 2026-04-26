import User from '../models/User';
import Order from '../models/Order';
import Product from '../models/Product';
import Cart from '../models/Cart';
import { AppError } from '../utils/AppError';

export class AdminService {
  async getAnalytics() {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    const orders = await Order.find({ status: { $in: ['Paid', 'Shipped', 'Delivered'] } });
    const totalSales = orders.reduce((sum, order) => sum + order.finalAmount, 0);

    return {
      totalUsers,
      totalOrders,
      totalProducts,
      totalSales,
    };
  }

  async getAllUsers(role?: string) {
    // V4: Whitelist role to known enum values — reject arbitrary strings from query params
    const VALID_ROLES = ['customer', 'vendor', 'admin'];
    const safeRole = role && VALID_ROLES.includes(role) ? role : undefined;
    const query = safeRole ? { role: safeRole } : {};
    return User.find(query).sort({ createdAt: -1 });
  }

  async updateVendorStatus(userId: string, isApprovedVendor: boolean) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    if (user.role !== 'vendor') {
      throw AppError.badRequest('User is not a vendor');
    }

    user.isApprovedVendor = isApprovedVendor;
    await user.save();

    return user.toSafeObject();
  }

  async deleteProduct(productId: string) {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) throw AppError.notFound('Product not found');
    // Cascade: remove deleted product from all customer carts
    await Cart.updateMany({}, { $pull: { items: { productId } } });
  }
}
