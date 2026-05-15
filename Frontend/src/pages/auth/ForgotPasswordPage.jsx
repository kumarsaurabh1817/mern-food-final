import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import Button from '../../components/auth/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    if (!email) { setEmailError('Email is required.'); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setEmailError('Enter a valid email address.'); return false; }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.success) {
        setSuccess(true);
      } else {
        setApiError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-5 text-center py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Check your inbox</h1>
            <p className="mt-2 text-sm text-slate-500">
              We sent a password reset link to <strong>{email}</strong>.
              The link expires in <strong>1 hour</strong>.
            </p>
          </div>
          <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
            <p className="text-xs font-semibold text-amber-700 mb-1">Didn't receive the email?</p>
            <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
              <li>Check your spam / junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>
                <button
                  onClick={() => { setSuccess(false); }}
                  className="font-semibold underline hover:text-amber-800"
                >
                  Try again with a different email
                </button>
              </li>
            </ul>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#FF9F43]"
          >
            Back to Login <ArrowRight size={16} />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#FF7A00] transition mb-4"
          >
            <ArrowLeft size={13} /> Back to Login
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF7A00]">
            Account Recovery
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Forgot Password?</h1>
          <p className="text-sm text-slate-500">
            Enter your registered email address and we'll send you a secure link to reset your password.
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
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); setApiError(''); }}
            autoComplete="email"
            error={emailError}
          />

          <Button type="submit" isLoading={loading}>
            <span>Send Reset Link</span>
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-[#FF7A00] hover:text-[#FF9F43]">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
