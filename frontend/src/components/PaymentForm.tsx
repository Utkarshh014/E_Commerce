import React, { useState } from 'react';

interface PaymentFormProps {
  onSubmit: (paymentData: PaymentData) => void;
  isLoading: boolean;
}

export interface PaymentData {
  paymentMethod: 'credit_card' | 'upi' | 'wallet';
  cardNumber?: string;
  expiryDate?: string;
  upiId?: string;
  walletBalance?: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, isLoading }) => {
  const [method, setMethod] = useState<'credit_card' | 'upi' | 'wallet'>('credit_card');
  const [cardNumber, setCardNumber] = useState('4111111111111111');
  const [expiryDate, setExpiryDate] = useState('12/28');
  const [upiId, setUpiId] = useState('user@upi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: PaymentData = { paymentMethod: method };
    if (method === 'credit_card') {
      data.cardNumber = cardNumber;
      data.expiryDate = expiryDate;
    } else if (method === 'upi') {
      data.upiId = upiId;
    } else {
      data.walletBalance = 1000;
    }
    onSubmit(data);
  };

  const methods = [
    { id: 'credit_card' as const, label: 'Credit Card', icon: '💳' },
    { id: 'upi' as const, label: 'UPI', icon: '📱' },
    { id: 'wallet' as const, label: 'Wallet', icon: '👛' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-bold text-slate-800">Payment Method</h3>

      {/* Method selection */}
      <div className="grid grid-cols-3 gap-3">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              method === m.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span className="text-2xl block mb-1">{m.icon}</span>
            <span className={`text-sm font-semibold ${method === m.id ? 'text-primary-700' : 'text-slate-600'}`}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Method-specific fields */}
      <div className="space-y-3 animate-fade-in">
        {method === 'credit_card' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
                placeholder="4111 1111 1111 1111"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Expiry Date</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
                placeholder="MM/YY"
              />
            </div>
          </>
        )}
        {method === 'upi' && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
              placeholder="yourname@upi"
            />
          </div>
        )}
        {method === 'wallet' && (
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-700 font-medium">
              👛 Wallet Balance: <span className="font-bold">$1,000.00</span>
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> Processing...
          </span>
        ) : (
          'Pay Now'
        )}
      </button>
    </form>
  );
};

export default PaymentForm;
