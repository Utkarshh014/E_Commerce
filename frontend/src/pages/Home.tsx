import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center animate-slide-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Welcome to
              <br />
              <span className="text-accent-300">ShopSmart</span>
            </h1>
            <p className="text-xl sm:text-2xl text-primary-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              Your one-stop shop for premium physical and digital products.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/products"
                className="px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all shadow-xl hover:shadow-2xl text-lg active:scale-95"
              >
                Browse Products →
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="px-8 py-4 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 transition-all shadow-xl hover:shadow-2xl text-lg active:scale-95"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">
          Why Choose <span className="gradient-text">ShopSmart</span>?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🔐', title: 'Secure Payments', desc: 'Credit Card, UPI & Wallet — all mocked but architecturally sound.' },
            { icon: '📦', title: 'Real-time Inventory', desc: 'Atomic stock updates with race condition protection.' },
            { icon: '🔔', title: 'Smart Notifications', desc: 'Email & in-app alerts via Observer Pattern.' },
            { icon: '🏷️', title: 'Flexible Discounts', desc: 'Percentage, flat, and coupon-based pricing via Strategy Pattern.' },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-slate-100"
            >
              <span className="text-4xl block mb-4">{f.icon}</span>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
};

export default Home;
