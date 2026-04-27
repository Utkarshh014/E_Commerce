import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import VendorStorefront from './pages/VendorStorefront';

// ─── 404 Page ──────────────────────────────────────────────────────
const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <span className="text-8xl mb-6">404</span>
    <h1 className="text-3xl font-bold text-slate-800 mb-2">Page Not Found</h1>
    <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
    <Link to="/" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
      Go Home
    </Link>
  </div>
);

// ─── Protected Route ────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><span className="animate-spin text-4xl">⏳</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><span className="animate-spin text-4xl">⏳</span></div>;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const VendorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isVendor, isApprovedVendor, refreshProfile } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><span className="animate-spin text-4xl">⏳</span></div>;
  if (!isAuthenticated || !isVendor) return <Navigate to="/" replace />;
  
  if (!isApprovedVendor) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Pending Approval</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          Your vendor account is pending admin approval. Once approved, you'll be able to list products and manage orders.
        </p>
        <button 
          onClick={() => refreshProfile()}
          className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          Check Approval Status
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// ─── Guest Route (redirect if already logged in) ────────────────────
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><span className="animate-spin text-4xl">⏳</span></div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<ProductList />} />
    <Route path="/products/:id" element={<ProductDetail />} />
    <Route path="/vendors/:id" element={<VendorStorefront />} />
    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
    <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/vendor/*" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main>
              <AppRoutes />
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
