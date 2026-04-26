import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  itemCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      setCart(res.data.data.cart);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productId: string, quantity = 1) => {
    const res = await api.post('/cart/items', { productId, quantity });
    setCart(res.data.data.cart);
  };

  const removeItem = async (productId: string) => {
    const res = await api.delete(`/cart/items/${productId}`);
    setCart(res.data.data.cart);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const res = await api.patch(`/cart/items/${productId}`, { quantity });
    setCart(res.data.data.cart);
  };

  const clearCart = async () => {
    const res = await api.delete('/cart');
    setCart(res.data.data.cart);
  };

  const getTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
  };

  const itemCount = cart?.items.reduce((t, i) => t + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, isLoading, addItem, removeItem, updateQuantity, clearCart, getTotal, itemCount, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};