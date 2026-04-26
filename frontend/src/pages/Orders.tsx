import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OrderStatus, { OrderProgress } from '../components/OrderStatus';

interface Order {
  _id: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number }>;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const endpoint = isAdmin ? '/orders/all' : '/orders/my-orders';
      const res = await api.get(endpoint);
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setOrderError('');
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update order status.';
      setOrderError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">
        📦 {isAdmin ? 'All Orders' : 'My Orders'}
      </h1>

      {orderError && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
          ❌ {orderError}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📭</span>
          <p className="text-xl text-slate-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-mono">#{order._id.slice(-8)}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <OrderStatus status={order.status} />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">${order.finalAmount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{order.items.length} item(s)</p>
                </div>
              </div>

              {/* Expanded details */}
              {selectedOrder === order._id && (
                <div className="border-t border-slate-100 p-5 animate-fade-in">
                  <OrderProgress status={order.status} />

                  <div className="space-y-2 mt-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                        <span className="text-slate-600">{item.name} × {item.quantity}</span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-sm">
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-${order.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base">
                      <span>Total Paid</span>
                      <span>${order.finalAmount.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Payment: {order.paymentMethod} | TX: {order.transactionId.slice(0, 12)}...
                    </p>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      {order.status === 'Paid' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Shipped')}
                          className="px-4 py-2 bg-violet-100 text-violet-700 font-medium rounded-lg text-sm hover:bg-violet-200 transition-colors"
                        >
                          🚚 Mark Shipped
                        </button>
                      )}
                      {order.status === 'Shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Delivered')}
                          className="px-4 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg text-sm hover:bg-emerald-200 transition-colors"
                        >
                          ✅ Mark Delivered
                        </button>
                      )}
                    </div>
                  )}

                  {/* Customer actions */}
                  {!isAdmin && order.status === 'Paid' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                        className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg text-sm hover:bg-red-100 transition-colors"
                      >
                        ❌ Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
