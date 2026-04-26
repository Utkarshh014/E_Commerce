import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  productType: string;
  description?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  downloadUrl?: string;
  licenseKey?: string;
  vendorId?: { name: string; vendorName?: string };
  categoryId?: { name: string };
  averageRating?: number;
  numReviews?: number;
}

interface Review {
  _id: string;
  userId: { name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.data.product);
    } catch {
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/products/${id}/reviews`);
      setReviews(res.data.data.reviews);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setCartError('');
    try {
      await addItem(product._id, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add to cart';
      setCartError(msg);
    }
  };

  const handleDelete = async () => {
    if (!product || !window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${product._id}`);
      navigate('/products');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment: reviewText });
      setReviewText('');
      setRating(5);
      fetchReviews();
      fetchProduct(); // to update averageRating
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="h-96 bg-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-20 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <button
        onClick={() => navigate('/products')}
        className="mb-6 text-primary-600 hover:text-primary-800 font-medium transition-colors"
      >
        ← Back to Products
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center h-96 overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{product.productType === 'digital' ? '💿' : '📦'}</span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
              product.productType === 'digital' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {product.productType === 'digital' ? '🔗 Digital Product' : '📦 Physical Product'}
            </span>
            {product.vendorId && (
              <span className="ml-3 text-sm text-slate-500 font-medium">
                Sold by <span className="text-slate-800">{product.vendorId.vendorName || product.vendorId.name}</span>
              </span>
            )}
          </div>

          <p className="text-sm text-primary-500 font-semibold uppercase tracking-wider">{product.categoryId?.name || product.category}</p>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          <div className="flex items-center gap-2">
            <p className="text-4xl font-extrabold text-slate-900">${product.price.toFixed(2)}</p>
            {product.numReviews !== undefined && product.numReviews > 0 && (
              <span className="ml-4 text-amber-500 text-sm font-medium">
                {'★'.repeat(Math.round(product.averageRating || 0))}{'☆'.repeat(5 - Math.round(product.averageRating || 0))} 
                <span className="text-slate-500 ml-1">({product.numReviews})</span>
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-slate-600 leading-relaxed">{product.description}</p>
          )}

          {/* Physical product details */}
          {product.productType === 'physical' && product.weight && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600"><strong>Weight:</strong> {product.weight} kg</p>
              {product.dimensions && (
                <p className="text-sm text-slate-600">
                  <strong>Dimensions:</strong> {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                </p>
              )}
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <span className="text-emerald-600 font-semibold">✅ In Stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-600 font-semibold">❌ Out of Stock</span>
            )}
          </div>

          {/* Add to Cart */}
          {isAuthenticated && product.stock > 0 && (
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-2.5 font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-lg active:scale-95 ${
                  addedToCart
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                }`}
              >
                {addedToCart ? '✅ Added to Cart!' : '🛒 Add to Cart'}
              </button>
            </div>
          )}
          {cartError && (
            <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-200">
              ❌ {cartError}
            </p>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                🗑️ Delete Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Customer Reviews</h2>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            {reviews.length === 0 ? (
              <p className="text-slate-500">No reviews yet.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r._id} className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-800">{r.userId.name}</span>
                      <span className="text-amber-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <p className="text-slate-600 text-sm">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAuthenticated && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Write a Review</h3>
              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Rating (1-5)</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg">
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Terrible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Comment</label>
                  <textarea required value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg">Submit Review</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
