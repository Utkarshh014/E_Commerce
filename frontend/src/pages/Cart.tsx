import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

const Cart: React.FC = () => {
  const { cart, isLoading, getTotal, clearCart, itemCount } = useCart();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">🛒 Shopping Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🛒</span>
          <p className="text-xl text-slate-500 mb-4">Your cart is empty</p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-md"
          >
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Cart Items */}
          {cart.items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}

          {/* Summary */}
          <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-600">Items ({itemCount})</span>
              <span className="font-semibold text-slate-800">${getTotal().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold border-t border-slate-100 pt-4">
              <span>Total</span>
              <span className="text-2xl text-slate-900">${getTotal().toFixed(2)}</span>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={clearCart}
                className="px-5 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-all"
              >
                Clear Cart
              </button>
              <Link
                to="/checkout"
                className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl text-center hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Proceed to Checkout →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
