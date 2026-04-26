import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Analytics {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalSales: number;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isApprovedVendor?: boolean;
  vendorName?: string;
  createdAt: string;
}

interface OrderData {
  _id: string;
  userId: { name: string; email: string } | string;
  status: string;
  finalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-violet-100 text-violet-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Pending: 'bg-amber-100 text-amber-700',
};

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'orders'>('users');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, usersRes, ordersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/orders/all'),
      ]);
      setAnalytics(analyticsRes.data.data);
      setUsers(usersRes.data.data.users);
      setOrders(ordersRes.data.data.orders);
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVendorApproval = async (userId: string, isApprovedVendor: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/vendor-status`, { isApprovedVendor });
      setUsers(users.map(u => u._id === userId ? { ...u, isApprovedVendor } : u));
    } catch (error) {
      console.error('Failed to update vendor status', error);
    }
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Status update failed');
    }
  };

  const filteredOrders = orderStatusFilter
    ? orders.filter(o => o.status === orderStatusFilter)
    : orders;

  const pendingVendors = users.filter(u => u.role === 'vendor' && !u.isApprovedVendor).length;

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Admin Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Total Sales</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">${analytics.totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Total Orders</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{analytics.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Total Users</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{analytics.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Total Products</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{analytics.totalProducts}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {(['users', 'orders'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'users'
              ? `Users (${users.length}${pendingVendors > 0 ? ` · 🟡 ${pendingVendors} pending` : ''})`
              : `Orders (${orders.length})`}
          </button>
        ))}
      </div>

      {/* ── Users Tab ─────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user._id} className={`hover:bg-slate-50 transition-colors ${user.role === 'vendor' && !user.isApprovedVendor ? 'bg-amber-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {user.name}
                      {user.vendorName && <span className="block text-xs text-slate-400">Store: {user.vendorName}</span>}
                      {user.role === 'vendor' && !user.isApprovedVendor && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">🟡 Pending Approval</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'vendor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'vendor' && (
                        <button
                          onClick={() => handleVendorApproval(user._id, !user.isApprovedVendor)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            user.isApprovedVendor
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {user.isApprovedVendor ? 'Revoke Vendor' : 'Approve Vendor'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Orders Tab ────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div>
          {/* Status filter */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-500 font-medium">Filter:</span>
            {['', 'Paid', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setOrderStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  orderStatusFilter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => {
                    const customer = typeof order.userId === 'object' ? order.userId : null;
                    return (
                      <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">#{order._id.slice(-8)}</td>
                        <td className="px-6 py-4">
                          {customer ? (
                            <>
                              <span className="font-medium text-slate-800">{customer.name}</span>
                              <span className="block text-xs text-slate-400">{customer.email}</span>
                            </>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">${order.finalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {order.status === 'Paid' && (
                              <button onClick={() => handleOrderStatus(order._id, 'Shipped')}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                                🚚 Ship
                              </button>
                            )}
                            {order.status === 'Shipped' && (
                              <button onClick={() => handleOrderStatus(order._id, 'Delivered')}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                                ✅ Deliver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


