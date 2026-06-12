import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import Button from '../../components/auth/Button';
import { signUp, selectAuthLoading, selectAuthError, clearError } from '../../features/auth/authSlice';
import { CheckCircle } from 'lucide-react';

const ROLES = [
  { value: 'user', label: 'Customer', desc: 'Order food from restaurants' },
  { value: 'owner', label: 'Restaurant Owner', desc: 'Manage your restaurant' },
  { value: 'delivery_boy', label: 'Delivery Agent', desc: 'Deliver orders and earn' },
];

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'user' });
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(signUp(form));
    if (signUp.fulfilled.match(result)) setSuccess(true);
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account created!</h2>
          <p className="text-gray-500 text-sm mb-1">
            {form.role === 'user'
              ? 'Your account is ready. You can now sign in!'
              : 'Your account is pending admin approval. You will be notified once approved.'}
          </p>
          <p className="text-gray-400 text-xs mb-6">
            {form.role === 'user' ? `Welcome aboard, ${form.name}!` : `We'll review ${form.email} shortly.`}
          </p>
          <Link to="/login" className="inline-block bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm">
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Join OrangeBite today">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">I want to join as</label>
          <div className="grid grid-cols-1 gap-2">
            {ROLES.map((r) => (
              <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.role === r.value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={handleChange} className="accent-orange-500" />
                <div>
                  <div className="text-sm font-semibold text-gray-800">{r.label}</div>
                  <div className="text-xs text-gray-400">{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField id="name" name="name" label="Full name" placeholder="John Doe" value={form.name} onChange={handleChange} error={errors.name} />
          <InputField id="phone" name="phone" label="Phone (optional)" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
        </div>
        <InputField id="email" name="email" type="email" label="Email address" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} />
        <InputField id="password" name="password" type="password" label="Password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} error={errors.password} />
        <Button type="submit" loading={loading} className="w-full py-3">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
