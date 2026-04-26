import React from 'react';
import { useCart } from '../context/CartContext';

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      {/* Image */}
      <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <span className="text-3xl">📦</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 truncate">{item.name}</h3>
        <p className="text-primary-600 font-bold">${item.price.toFixed(2)}</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold text-slate-800">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right min-w-[80px]">
        <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.productId)}
        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        title="Remove item"
      >
        🗑️
      </button>
    </div>
  );
};

export default CartItem;
