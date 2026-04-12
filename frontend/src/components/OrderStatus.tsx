import React from 'react';

interface OrderStatusProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; bg: string }> = {
  Pending: { color: 'text-amber-700', icon: '⏳', bg: 'bg-amber-50 border-amber-200' },
  Paid: { color: 'text-blue-700', icon: '💳', bg: 'bg-blue-50 border-blue-200' },
  Shipped: { color: 'text-violet-700', icon: '🚚', bg: 'bg-violet-50 border-violet-200' },
  Delivered: { color: 'text-emerald-700', icon: '✅', bg: 'bg-emerald-50 border-emerald-200' },
  Cancelled: { color: 'text-red-700', icon: '❌', bg: 'bg-red-50 border-red-200' },
};

const OrderStatus: React.FC<OrderStatusProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${config.bg} ${config.color} font-semibold rounded-full border`}
    >
      <span>{config.icon}</span>
      {status}
    </span>
  );
};

// ─── Order Progress Bar ─────────────────────────────────────────────
const STEPS = ['Pending', 'Paid', 'Shipped', 'Delivered'];

export const OrderProgress: React.FC<{ status: string }> = ({ status }) => {
  const currentIndex = STEPS.indexOf(status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="px-4 py-2 bg-red-50 text-red-700 rounded-full font-semibold border border-red-200">
          ❌ Order Cancelled
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full py-4">
      {STEPS.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                index <= currentIndex
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {index < currentIndex ? '✓' : index + 1}
            </div>
            <span className={`text-xs mt-1.5 font-medium ${
              index <= currentIndex ? 'text-primary-700' : 'text-slate-400'
            }`}>
              {step}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              index < currentIndex ? 'bg-primary-500' : 'bg-slate-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default OrderStatus;
