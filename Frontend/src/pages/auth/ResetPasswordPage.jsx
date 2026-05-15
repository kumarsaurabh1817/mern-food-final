import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import Button from '../../components/auth/Button';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    setApiError('');
  };

  const validate = () => {
    const next = {};
    if (!form.newPassword) {
      next.newPassword = 'Password is required.';
    } else if (form.newPassword.length < 8) {
      next.newPassword = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(form.newPassword)) {
      next.newPassword = 'Password must contain at least one uppercase letter.';
    } else if (!/[0-9]/.test(form.newPassword)) {
      next.newPassword = 'Password must contain at least one number.';
    }
    if (!form.confirm) {
      next.confirm = 'Please confirm your password.';
    } else if (form.newPassword !== form.confirm) {
      next.confirm = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        newPassword: form.newPassword,
      });
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setApiError(data.message || 'Reset failed. Please try again.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'The reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Password Updated!</h1>
          <p className="text-sm text-slate-500">
            Your password has been reset successfully. Redirecting you to login…
          </p>
          <Link
            to="/login"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#FF9F43]"
          >
            Go to Login <ArrowRight size={16} />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF7A00]">
            Security
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-sm text-slate-500">
            Enter your new password below. Use at least 8 characters, one uppercase letter, and one number.
          </p>
        </div>

        {apiError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-600">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="New Password"
            type={showPw ? 'text' : 'password'}
            icon={Lock}
            endIcon={showPw ? EyeOff : Eye}
            onEndClick={() => setShowPw(prev => !prev)}
            placeholder="Min. 8 characters"
            value={form.newPassword}
            onChange={e => updateField('newPassword', e.target.value)}
            autoComplete="new-password"
            error={errors.newPassword}
          />

          <InputField
            label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            icon={Lock}
            endIcon={showConfirm ? EyeOff : Eye}
            onEndClick={() => setShowConfirm(prev => !prev)}
            placeholder="Repeat your new password"
            value={form.confirm}
            onChange={e => updateField('confirm', e.target.value)}
            autoComplete="new-password"
            error={errors.confirm}
          />

          <Button type="submit" isLoading={loading}>
            <span>Set New Password</span>
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Remember it?{' '}
          <Link to="/login" className="font-semibold text-[#FF7A00] hover:text-[#FF9F43]">
            Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
