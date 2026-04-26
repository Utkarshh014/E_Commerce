import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  productType: string;
  description?: string;
}

interface VendorInfo {
  _id: string;
  name: string;
  vendorName?: string;
}

const VendorStorefront: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (id) fetchStorefront();
  }, [id, page]);

  const fetchStorefront = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.get('/products', { params: { vendorId: id, page, limit: 12 } });
      setProducts(res.data.data.products);
      setTotalPages(res.data.data.pages || 1);

      // Populate vendor info from first product if available
      if (res.data.data.products.length > 0 && res.data.data.products[0].vendorId) {
        setVendor(res.data.data.products[0].vendorId);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load vendor storefront.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = vendor?.vendorName || vendor?.name || 'Vendor';

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-10 bg-slate-200 rounded w-1/3 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center px-4">
        <span className="text-6xl block mb-4">🏪</span>
        <p className="text-red-600 font-semibold">{error}</p>
        <Link to="/products" className="mt-6 inline-block text-primary-600 hover:underline">← Browse all products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      {/* Storefront Header */}
      <div className="bg-gradient-to-r from-primary-50 to-violet-50 rounded-3xl p-8 mb-10 flex items-center gap-6 shadow-sm border border-primary-100">
        <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {displayName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">Seller Storefront</p>
          <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
          <p className="text-slate-500 text-sm mt-1">{products.length} product{products.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📭</span>
          <p className="text-xl text-slate-500">This vendor has no products yet.</p>
          <Link to="/products" className="mt-4 inline-block text-primary-600 hover:underline">← Browse all products</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                ← Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorStorefront;
