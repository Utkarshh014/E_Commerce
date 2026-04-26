import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [vendorName, setVendorName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, role, vendorName);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🚀</span>
          <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-2">Join ShopSmart today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200 animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">I want to</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={role === 'customer'} onChange={() => setRole('customer')} className="text-primary-600" /> Buy Products
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={role === 'vendor'} onChange={() => setRole('vendor')} className="text-primary-600" /> Sell Products
              </label>
            </div>
          </div>

          {role === 'vendor' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Store Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required={role === 'vendor'}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-500 outline-none transition-all"
                placeholder="My Awesome Store"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-800 transition-colors">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
