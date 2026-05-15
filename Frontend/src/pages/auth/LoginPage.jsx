import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signIn, clearError } from '../../features/auth/authSlice';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import Button from '../../components/auth/Button';

const DEMO_USERS = [
  { label: 'Customer', email: 'customer@demo.com' },
  { label: 'Owner', email: 'owner@demo.com' },
  { label: 'Delivery', email: 'delivery@demo.com' },
  { label: 'Admin', email: 'admin@demo.com' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.email) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validate()) return;

    const res = await dispatch(signIn(form));
    if (res.meta.requestStatus === 'fulfilled') {
      const role = res.payload.user?.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'owner') navigate('/owner');
      else if (role === 'delivery_boy') navigate('/delivery');
      else navigate('/');
    }
  };

  const fillDemo = (email) => {
    setForm({ email, password: 'demo1234' });
    setErrors({});
  };

  return (
    <AuthLayout>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF7A00]">Sign In</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500">Access your dashboard and manage orders.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            autoComplete="email"
            error={errors.email}
          />

          <InputField
            label="Password"
            type={showPw ? 'text' : 'password'}
            icon={Lock}
            endIcon={showPw ? EyeOff : Eye}
            onEndClick={() => setShowPw((prev) => !prev)}
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            autoComplete="current-password"
            error={errors.password}
            labelAction={(
              <Link to="/forgot-password" className="text-xs font-semibold text-slate-500 hover:text-[#FF7A00]">
                Forgot password?
              </Link>
            )}
          />

          <Button type="submit" isLoading={loading}>
            <span>Sign In</span>
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or continue with
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => fillDemo(demo.email)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-[#FF7A00]"
            >
              {demo.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 text-center">
          <p className="text-sm text-slate-500">
            Do not have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#FF7A00] hover:text-[#FF9F43]">
              Sign up
            </Link>
          </p>
          <Link
            to="/signup"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-[#FF7A00]"
          >
            Create new account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
