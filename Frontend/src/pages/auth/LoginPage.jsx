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
  const error = useSelector(selectAuthError);

  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(signIn(form));
    if (signIn.fulfilled.match(result)) {
      const role = result.payload?.role;
      navigate(ROLE_REDIRECT[role] || '/');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your OrangeBite account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <InputField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
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
          required
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
