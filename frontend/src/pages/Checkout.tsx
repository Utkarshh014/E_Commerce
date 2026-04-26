import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PaymentForm, { PaymentData } from '../components/PaymentForm';
import api from '../services/api';

const Checkout: React.FC = () => {
  const { cart, getTotal, refreshCart } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState<{ discountAmount: number; discountedPrice: number; description: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const total = getTotal();
  const finalAmount = discount ? discount.discountedPrice : total;

  // L5: useEffect prevents calling navigate() during render (React render purity)
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const applyCoupon = async () => {
    setCouponError('');
    setDiscount(null);
    try {
      const res = await api.post('/discounts/apply', {
        price: total,
        type: 'coupon',
        couponCode,
      });
      setDiscount(res.data.data.discount);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid coupon';
      setCouponError(msg);
    }
  };

  const handlePayment = async (paymentData: PaymentData) => {
    setIsLoading(true);
    setError('');

    // Validate all shipping address fields before submitting
    const missingFields = Object.entries(address)
      .filter(([, v]) => !v.trim())
      .map(([k]) => k);
    if (missingFields.length > 0) {
      setError(`Shipping address is incomplete. Missing: ${missingFields.join(', ')}.`);
      setIsLoading(false);
      return;
    }

    try {
      const orderData: Record<string, unknown> = {
        ...paymentData,
        shippingAddress: address,
      };
      if (discount && couponCode) {
        orderData.discount = { type: 'coupon', couponCode };
      }
      await api.post('/orders', orderData);
      await refreshCart();
      navigate('/orders');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Checkout failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">💳 Checkout</h1>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Left: Address + Payment */}
        <div className="md:col-span-3 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">📍 Shipping Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none"
                  placeholder="Street"
                />
              </div>
              <input
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none"
                placeholder="City"
              />
              <input
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none"
                placeholder="State"
              />
              <input
                value={address.zipCode}
                onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none"
                placeholder="ZIP Code"
              />
              <input
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 outline-none"
                placeholder="Country"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <PaymentForm onSubmit={handlePayment} isLoading={isLoading} />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium animate-fade-in">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm sticky top-20">
            <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Order Summary</h3>

            <div className="space-y-3 mb-6">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-slate-600 truncate mr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-slate-800">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-slate-100 pt-4 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                />
                <button
                  onClick={applyCoupon}
                  className="px-4 py-2 bg-primary-100 text-primary-700 font-medium rounded-lg text-sm hover:bg-primary-200 transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {discount && (
                <p className="text-emerald-600 text-xs mt-1 font-medium">
                  ✅ {discount.description} (-${discount.discountAmount.toFixed(2)})
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700">${total.toFixed(2)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount</span>
                  <span className="text-emerald-600">-${discount.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>${finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
