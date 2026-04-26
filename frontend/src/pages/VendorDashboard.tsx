import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';

interface Category { _id: string; name: string; }
interface Product { _id: string; name: string; price: number; stock: number; description?: string; productType: string; imageUrl?: string; imageUrls?: string[]; categoryId?: { _id: string; name: string } | string; }

interface SubOrderView {
  orderId: string;
  createdAt: string;
  paymentMethod: string;
  customerId: { name: string; email: string };
  shippingAddress: { city: string; country: string };
  subOrder: {
    items: Array<{ name: string; quantity: number; price: number }>;
    subTotal: number;
    status: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-violet-100 text-violet-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Pending: 'bg-amber-100 text-amber-700',
};

const BLANK_FORM = { name: '', price: '', stock: '', description: '', productType: 'physical', categoryId: '' };

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SubOrderView[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, catsRes] = await Promise.all([
        api.get('/vendor/products'),
        api.get('/vendor/orders'),
        api.get('/products/categories'),
      ]);
      setProducts(productsRes.data.data.products);
      setOrders(ordersRes.data.data.orders);
      setCategories(catsRes.data.data.categories);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to load dashboard data. Please refresh.';
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (user?._id) fetchData(); }, [user]);

  // ── Image Handling ───────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append('image', imageFile);
    const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data.imageUrl as string;
  };

  // ── Form Handlers ────────────────────────────────────────────────
  const openCreate = () => {
    setEditingProduct(null);
    setForm(BLANK_FORM);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      description: p.description || '',
      productType: p.productType,
      categoryId: typeof p.categoryId === 'object' ? p.categoryId._id : (p.categoryId || ''),
    });
    setImageFile(null);
    setImagePreview(p.imageUrl || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        uploadedImageUrl = await uploadImage();
      }

      const payload: Record<string, unknown> = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
      };
      if (uploadedImageUrl) {
        payload.imageUrl = uploadedImageUrl;
        payload.imageUrls = [uploadedImageUrl, ...(editingProduct?.imageUrls || [])];
      }

      if (editingProduct) {
        await api.put(`/vendor/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/vendor/products', payload);
      }

      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch {
      alert('Failed to delete product');
    }
  };

  // ── SubOrder Status Update ───────────────────────────────────────
  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await api.patch(`/vendor/orders/${orderId}/status`, { status });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Status update failed');
    }
  };

  const nextStatuses: Record<string, string[]> = {
    Paid: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered', 'Cancelled'],
    Delivered: [],
    Cancelled: [],
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Vendor Dashboard...</div>;
  if (fetchError) return (
    <div className="max-w-2xl mx-auto mt-16 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
      <p className="text-red-700 font-semibold text-lg mb-2">⚠️ Failed to load dashboard</p>
      <p className="text-red-600 text-sm mb-4">{fetchError}</p>
      <button onClick={fetchData} className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
        Retry
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Vendor Dashboard</h1>
          <p className="text-slate-500 mt-1">Store: <span className="font-semibold">{user?.vendorName || user?.name}</span></p>
        </div>
        {activeTab === 'products' && (
          <button onClick={openCreate} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
            + Add Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {(['products', 'orders'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab} {tab === 'products' ? `(${products.length})` : `(${orders.length})`}
          </button>
        ))}
      </div>

      {/* ── Product Form Modal ──────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>

            {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Product Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Price ($)</label>
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Stock</label>
                  <input required type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none bg-white">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                <select value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none" disabled={!!editingProduct}>
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Product Image</label>
                {imagePreview && <img src={imagePreview} alt="preview" className="w-32 h-32 object-cover rounded-lg mb-2" />}
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:bg-slate-50 w-full">
                  {imageFile ? imageFile.name : 'Choose image…'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              <button type="submit" disabled={formLoading}
                className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50">
                {formLoading ? 'Saving…' : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Products Tab ────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="text-5xl block mb-3">📦</span>
              <p className="font-medium">No products yet.</p>
              <button onClick={openCreate} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium">Add your first product</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-9 h-9 rounded-lg object-cover" alt={p.name} />
                          ) : <span className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg text-lg">{p.productType === 'digital' ? '💿' : '📦'}</span>}
                          <span className="font-medium text-slate-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">${p.price.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-green-600'}`}>{p.stock}</span>
                      </td>
                      <td className="px-5 py-3 capitalize">{p.productType}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link to={`/products/${p._id}`} className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">View</Link>
                          <button onClick={() => openEdit(p)} className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">Edit</button>
                          <button onClick={() => handleDelete(p._id)} className="px-3 py-1 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ──────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
              <span className="text-5xl block mb-3">📭</span>
              <p className="font-medium">No orders yet.</p>
            </div>
          ) : orders.map(o => (
            <div key={`${o.orderId}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-slate-400 mb-1">Order #{o.orderId.slice(-8)}</p>
                  <p className="text-sm text-slate-500">
                    Customer: <span className="font-medium text-slate-700">{o.customerId?.name}</span>
                    {' '}· {o.shippingAddress?.city}, {o.shippingAddress?.country}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.subOrder.status] || 'bg-slate-100 text-slate-600'}`}>
                    {o.subOrder.status}
                  </span>
                  <p className="text-base font-bold text-slate-800 mt-1">${o.subOrder.subTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {o.subOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-slate-600">
                    <span>{item.quantity}× {item.name}</span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Status Action Buttons */}
              {(nextStatuses[o.subOrder.status] || []).length > 0 && (
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  {(nextStatuses[o.subOrder.status] || []).map(s => (
                    <button key={s} onClick={() => handleStatusUpdate(o.orderId, s)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        s === 'Cancelled' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                        s === 'Delivered' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                        'bg-violet-50 text-violet-700 hover:bg-violet-100'
                      }`}>
                      Mark {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
