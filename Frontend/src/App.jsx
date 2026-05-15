import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadSession } from './features/auth/authSlice';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import OwnerLayout from './layouts/OwnerLayout';
import DeliveryLayout from './layouts/DeliveryLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Customer pages
import HomePage from './pages/customer/HomePage';
import RestaurantPage from './pages/customer/RestaurantPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import OrdersPage from './pages/customer/OrdersPage';
import AllRestaurantsPage from './pages/customer/AllRestaurantsPage';
import ProfilePage from './pages/customer/ProfilePage';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import ShopSetupPage from './pages/owner/ShopSetupPage';
import MenuPage from './pages/owner/MenuPage';
import OwnerOrdersPage from './pages/owner/OwnerOrdersPage';

// Delivery pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminShopsPage from './pages/admin/AdminShopsPage';

// Shared
import Toast from './components/ui/Toast';
import ClearCartModal from './components/cart/ClearCartModal';
import NotFoundPage from './pages/NotFoundPage';

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} className="animate-spin" />
  </div>
);

function ProtectedRoute({ roles }) {
  const { user, loading } = useSelector(s => s.auth);
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { user, loading } = useSelector(s => s.auth);
  if (loading) return <Spinner />;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    if (user.role === 'delivery_boy') return <Navigate to="/delivery" replace />;
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toast />
      <ClearCartModal />
      <Routes>
        {/* Guest-only routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Reset-password link from email — public, no auth needed */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Customer routes */}
        <Route element={<ProtectedRoute roles={['user']} />}>
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/restaurants" element={<AllRestaurantsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/track/:orderId" element={<OrderTrackingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Owner routes */}
        <Route path="/owner" element={<ProtectedRoute roles={['owner']} />}>
          <Route element={<OwnerLayout />}>
            <Route index element={<OwnerDashboard />} />
            <Route path="shop" element={<ShopSetupPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="orders" element={<OwnerOrdersPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Delivery routes */}
        <Route path="/delivery" element={<ProtectedRoute roles={['delivery_boy']} />}>
          <Route element={<DeliveryLayout />}>
            <Route index element={<DeliveryDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="shops" element={<AdminShopsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
