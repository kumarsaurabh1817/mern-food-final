import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import Button from '../../components/auth/Button';
import { signIn, selectAuthLoading, selectAuthError, clearError } from '../../features/auth/authSlice';

const ROLE_REDIRECT = { user: '/', owner: '/owner', delivery_boy: '/delivery', admin: '/admin' };

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  // authError can be string or {message, fields} object
  const globalErrorMsg = authError
    ? (typeof authError === 'object' ? authError.message : authError)
    : null;

  const validate = () => {
    const e = {};
    if (!form.email.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Please enter a valid email address';
    }
    if (!form.password) {
      e.password = 'Password is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear field-level error as user types
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    // Clear global auth error as user types
    if (authError) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(signIn(form));
    if (signIn.fulfilled.match(result)) {
      const role = result.payload?.role;
      navigate(ROLE_REDIRECT[role] || '/');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your OrangeBite account">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Global error — shown for wrong credentials / server errors */}
        {globalErrorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {globalErrorMsg}
          </div>
        )}

        <InputField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        <InputField
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full py-3">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-orange-500 font-semibold hover:text-orange-600">Create one</Link>
      </p>
    </AuthLayout>
  );
}
