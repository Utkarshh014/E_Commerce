import React, { useState, useEffect } from 'react';
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

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, productType, page, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = { page, limit: 12 };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (productType) params.productType = productType;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/products', { params });
      setProducts(res.data.data.products);
      setTotalPages(res.data.data.pages);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // setPage triggers the useEffect which re-fetches with the current searchQuery
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">🛍️ All Products</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-l-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none"
            />
            <button
              type="submit"
              className="px-6 bg-primary-600 text-white font-medium rounded-r-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-600 focus:ring-2 focus:ring-primary-300 outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={productType}
          onChange={(e) => { setProductType(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-600 focus:ring-2 focus:ring-primary-300 outline-none"
        >
          <option value="">All Types</option>
          <option value="physical">📦 Physical</option>
          <option value="digital">💿 Digital</option>
        </select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🔍</span>
          <p className="text-xl text-slate-500">No products found.</p>
          <p className="text-slate-400 mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

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
          <span className="px-4 py-2 text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
