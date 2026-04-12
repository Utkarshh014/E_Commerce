import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    imageUrl?: string;
    productType: string;
    description?: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addItem(product._id, 1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <span className="text-5xl">
            {product.productType === 'digital' ? '💿' : '📦'}
          </span>
        )}
        {/* Badge */}
        <span className={`absolute top-3 left-3 px-2 py-0.5 text-xs font-semibold rounded-full ${
          product.productType === 'digital' 
            ? 'bg-violet-100 text-violet-700' 
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {product.productType === 'digital' ? '🔗 Digital' : '📦 Physical'}
        </span>
        {/* Stock indicator */}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
            Out of stock
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-primary-500 font-semibold uppercase tracking-wide mb-1">
          {product.category}
        </p>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1 group-hover:text-primary-700 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">${product.price.toFixed(2)}</span>
          {isAuthenticated && product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
