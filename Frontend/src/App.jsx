import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadSession, selectUser, selectAuthInitialized } from './features/auth/authSlice';

import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import OwnerLayout from './layouts/OwnerLayout';
import DeliveryLayout from './layouts/DeliveryLayout';
import AdminLayout from './layouts/AdminLayout';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import HomePage from './pages/customer/HomePage';
import AllRestaurantsPage from './pages/customer/AllRestaurantsPage';
import RestaurantPage from './pages/customer/RestaurantPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import ProfilePage from './pages/customer/ProfilePage';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import ShopSetupPage from './pages/owner/ShopSetupPage';
import MenuPage from './pages/owner/MenuPage';
import OwnerOrdersPage from './pages/owner/OwnerOrdersPage';
import OwnerProfilePage from './pages/owner/OwnerProfilePage';

import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryProfilePage from './pages/delivery/DeliveryProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminShopsPage from './pages/admin/AdminShopsPage';

import NotFoundPage from './pages/NotFoundPage';
import Toast from './components/ui/Toast';
import ClearCartModal from './components/cart/ClearCartModal';

const ROLE_HOME = { user: '/', owner: '/owner', delivery_boy: '/delivery', admin: '/admin' };

function ProtectedRoute({ children, allowedRoles }) {
  const user = useSelector(selectUser);
  const initialized = useSelector(selectAuthInitialized);

  if (!initialized) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return children;
}

function GuestRoute({ children }) {
  const user = useSelector(selectUser);
  const initialized = useSelector(selectAuthInitialized);
  if (!initialized) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return children;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  return (
    <>
      <Toast />
      <ClearCartModal />
      <Routes>
        {/* Guest routes */}
        <Route element={<GuestRoute><PublicLayout /></GuestRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* Customer routes */}
        <Route element={<ProtectedRoute allowedRoles={['user']}><CustomerLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<AllRestaurantsPage />} />
          <Route path="/restaurant/:id" element={<RestaurantPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/track/:orderId" element={<OrderTrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Owner routes */}
        <Route element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout /></ProtectedRoute>}>
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/shop" element={<ShopSetupPage />} />
          <Route path="/owner/menu" element={<MenuPage />} />
          <Route path="/owner/orders" element={<OwnerOrdersPage />} />
          <Route path="/owner/profile" element={<OwnerProfilePage />} />
        </Route>

        {/* Delivery routes */}
        <Route element={<ProtectedRoute allowedRoles={['delivery_boy']}><DeliveryLayout /></ProtectedRoute>}>
          <Route path="/delivery" element={<DeliveryDashboard />} />
          <Route path="/delivery/profile" element={<DeliveryProfilePage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/shops" element={<AdminShopsPage />} />
        </Route>



        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
