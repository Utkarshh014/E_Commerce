import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🛒</span>
            <span className="text-xl font-bold gradient-text">MiniAmazon</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-slate-600 hover:text-primary-700 font-medium transition-colors">
              Products
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-slate-600 hover:text-primary-700 font-medium transition-colors">
                  Orders
                </Link>

                <Link to="/cart" className="relative text-slate-600 hover:text-primary-700 transition-colors">
                  <span className="text-xl">🛍️</span>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-accent-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold animate-pulse-soft">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {isAdmin && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    Admin
                  </span>
                )}

                <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                  <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary-700 font-medium hover:bg-primary-50 rounded-lg transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col space-y-3">
              <Link to="/products" className="text-slate-600 font-medium" onClick={() => setMobileOpen(false)}>Products</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className="text-slate-600 font-medium" onClick={() => setMobileOpen(false)}>Orders</Link>
                  <Link to="/cart" className="text-slate-600 font-medium" onClick={() => setMobileOpen(false)}>Cart ({itemCount})</Link>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-left text-red-500 font-medium">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-primary-700 font-medium" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link to="/register" className="text-primary-700 font-medium" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
