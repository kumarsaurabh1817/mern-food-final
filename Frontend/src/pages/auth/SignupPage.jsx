import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signUp, signIn, clearError } from '../../features/auth/authSlice';
import { User, Truck, Store, Mail, Lock, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import RoleCard from '../../components/auth/RoleCard';
import Button from '../../components/auth/Button';

const ROLES = [
  { value: 'user', label: 'Customer', icon: User, desc: 'Order food from top restaurants.' },
  { value: 'owner', label: 'Restaurant Owner', icon: Store, desc: 'Manage your shop and menu.' },
  { value: 'delivery_boy', label: 'Delivery Agent', icon: Truck, desc: 'Deliver orders and earn.' }
];

const getPasswordStrength = (password) => {
  if (!password) return { label: 'Enter a password', pct: 0, bar: 'bg-slate-200', text: 'text-slate-400' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: 'Weak', pct: 25, bar: 'bg-red-400', text: 'text-red-500' };
  if (score === 2) return { label: 'Fair', pct: 50, bar: 'bg-amber-400', text: 'text-amber-500' };
  if (score === 3) return { label: 'Good', pct: 75, bar: 'bg-orange-400', text: 'text-orange-500' };
  return { label: 'Strong', pct: 100, bar: 'bg-emerald-400', text: 'text-emerald-500' };
};

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email.';
    if (form.phone && !/^\+?\d{8,15}$/.test(form.phone)) next.phone = 'Enter a valid phone number.';
    if (!form.password || form.password.length < 8) next.password = 'Use at least 8 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validate()) return;

    const res = await dispatch(signUp(form));
    if (res.meta.requestStatus === 'fulfilled') {
      if (res.payload?.session && res.payload?.user) {
        const role = res.payload.user?.role;
        if (role === 'admin') navigate('/admin');
        else if (role === 'owner') navigate('/owner');
        else if (role === 'delivery_boy') navigate('/delivery');
        else navigate('/');
        return;
      }

      if (form.role === 'user') {
        const loginRes = await dispatch(signIn({ email: form.email, password: form.password }));
        if (loginRes.meta.requestStatus === 'fulfilled') {
          const role = loginRes.payload.user?.role;
          if (role === 'admin') navigate('/admin');
          else if (role === 'owner') navigate('/owner');
          else if (role === 'delivery_boy') navigate('/delivery');
          else navigate('/');
        }
      }
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF7A00]">Create Account</p>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: '#FF7A00' }}>Join Orange Bite</h1>
          <p className="text-sm text-slate-500">Choose a role and get started.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {ROLES.map((role) => (
              <RoleCard
                key={role.value}
                icon={role.icon}
                label={role.label}
                description={role.desc}
                selected={form.role === role.value}
                onClick={() => updateField('role', role.value)}
              />
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <InputField
              label="Full Name"
              type="text"
              icon={User}
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              autoComplete="name"
              error={errors.name}
            />

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
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <InputField
              label="Phone (optional)"
              type="tel"
              icon={Phone}
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              autoComplete="tel"
              error={errors.phone}
            />

            <InputField
              label="Password"
              type={showPw ? 'text' : 'password'}
              icon={Lock}
              endIcon={showPw ? EyeOff : Eye}
              onEndClick={() => setShowPw((prev) => !prev)}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete="new-password"
              error={errors.password}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Password strength</span>
              <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition ${strength.bar}`}
                style={{ width: `${strength.pct}%` }}
              />
            </div>
          </div>

          <div className="min-h-[44px]">
            {(form.role === 'owner' || form.role === 'delivery_boy') && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold text-amber-600">
                Accounts for owners and delivery agents require admin approval before activation.
              </div>
            )}
          </div>

          <Button type="submit" isLoading={loading}>
            <span>Create Account</span>
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>

        <div className="space-y-2 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#FF7A00] hover:text-[#FF9F43]">
              Sign in
            </Link>
          </p>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-[#FF7A00]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
