import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { setUser, signOut } from '../../features/auth/authSlice';
import { showToast } from '../../features/ui/uiSlice';
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Loader2, ArrowLeft,
  Shield, Edit3, Save, X,
} from 'lucide-react';

// ─── Reusable styled input ────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, disabled, placeholder, error, endIcon, onEndClick, autoComplete }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%', padding: '11px 14px', paddingRight: endIcon ? '42px' : '14px',
            borderRadius: '12px', border: `1.5px solid ${error ? '#EF4444' : '#E5E7EB'}`,
            background: disabled ? '#F9FAFB' : '#fff', outline: 'none',
            fontSize: '14px', color: '#1A1A1A', fontFamily: 'inherit',
            fontWeight: 500, boxSizing: 'border-box',
            transition: 'border-color 0.2s ease',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          onFocus={e => { if (!disabled && !error) e.target.style.borderColor = '#FF7A00'; }}
          onBlur={e => { if (!error) e.target.style.borderColor = '#E5E7EB'; }}
        />
        {endIcon && (
          <button
            type="button"
            onClick={onEndClick}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px',
            }}
          >
            {endIcon}
          </button>
        )}
      </div>
      {error && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px',
      padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,122,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="#FF7A00" />
        </div>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1A1A1A' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function Alert({ type, message }) {
  const isSuccess = type === 'success';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px',
      borderRadius: '12px', marginBottom: '14px',
      background: isSuccess ? '#F0FDF4' : '#FEF2F2',
      border: `1.5px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}`,
    }}>
      {isSuccess
        ? <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} />
        : <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />}
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: isSuccess ? '#15803D' : '#DC2626' }}>{message}</p>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  // ── Profile form state
  const [profile, setProfile]         = useState({ name: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg]   = useState(null); // { type, text }
  const [editingProfile, setEditingProfile] = useState(false);

  // ── Password form state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwMsg, setPwMsg]           = useState(null);

  // Load user data into form on mount
  useEffect(() => {
    if (user) setProfile({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  // ── Profile save
  const handleProfileSave = async () => {
    if (!profile.name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const { data } = await api.patch('/users/me', {
        name: profile.name.trim(),
        phone: profile.phone.trim() || undefined,
      });
      if (data.success) {
        dispatch(setUser({ ...user, ...data.user }));
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        setEditingProfile(false);
        dispatch(showToast({ message: 'Profile updated!', type: 'success' }));
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Update failed.' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Password validation
  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required.';
    if (!pwForm.newPassword) {
      errs.newPassword = 'New password is required.';
    } else if (pwForm.newPassword.length < 8) {
      errs.newPassword = 'At least 8 characters required.';
    } else if (!/[A-Z]/.test(pwForm.newPassword)) {
      errs.newPassword = 'Must include an uppercase letter.';
    } else if (!/[0-9]/.test(pwForm.newPassword)) {
      errs.newPassword = 'Must include a number.';
    } else if (!/[@$!%*#?&^()_\-+=<>]/.test(pwForm.newPassword)) {
      errs.newPassword = 'Must include a special character.';
    }
    if (!pwForm.confirm) {
      errs.confirm = 'Please confirm your new password.';
    } else if (pwForm.newPassword !== pwForm.confirm) {
      errs.confirm = 'Passwords do not match.';
    }
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Password save
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;
    setPwLoading(true);
    setPwMsg(null);
    try {
      const { data } = await api.post('/users/me/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      if (data.success) {
        setPwMsg({ type: 'success', text: data.message });
        setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
        dispatch(showToast({ message: 'Password changed! Logging out other devices.', type: 'success' }));
        // Log out after 3s since all refresh tokens are now revoked
        setTimeout(async () => {
          await dispatch(signOut());
          navigate('/login');
        }, 3000);
      } else {
        setPwMsg({ type: 'error', text: data.message || 'Password change failed.' });
      }
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const togglePw = (field) => setShowPw(p => ({ ...p, [field]: !p[field] }));

  const PwBtn = ({ field }) => (showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px 100px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', flexShrink: 0 }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}>My Profile</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>Manage your personal details and account security</p>
        </div>
      </div>

      {/* Avatar strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', background: 'linear-gradient(135deg, #FF7A00, #FF9F43)', borderRadius: '20px', marginBottom: '20px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)' }}>
          <User size={26} color="#fff" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>{user?.name || 'User'}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{user?.email}</p>
          <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '2px 10px', borderRadius: '100px' }}>
            {user?.role || 'user'}
          </span>
        </div>
      </div>

      {/* ── Section 1: Personal Info ── */}
      <Card title="Personal Information" icon={User}>
        {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field
            label="Full Name"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            disabled={!editingProfile}
            placeholder="Your full name"
          />
          <Field
            label="Email Address"
            type="email"
            value={user?.email || ''}
            disabled
            placeholder="Email (cannot be changed)"
          />
          <Field
            label="Phone Number"
            type="tel"
            value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
            disabled={!editingProfile}
            placeholder="e.g. 9876543210"
            autoComplete="tel"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {!editingProfile ? (
            <button
              onClick={() => { setEditingProfile(true); setProfileMsg(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '11px 20px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
                color: '#fff', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(255,122,0,0.3)',
              }}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleProfileSave}
                disabled={profileLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '11px 20px', borderRadius: '12px', border: 'none',
                  background: profileLoading ? '#FED7AA' : 'linear-gradient(135deg, #FF7A00, #FF9F43)',
                  color: '#fff', fontWeight: 700, fontSize: '13px',
                  cursor: profileLoading ? 'wait' : 'pointer', fontFamily: 'inherit',
                  boxShadow: profileLoading ? 'none' : '0 4px 12px rgba(255,122,0,0.3)',
                }}
              >
                {profileLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => { setEditingProfile(false); setProfile({ name: user?.name || '', phone: user?.phone || '' }); setProfileMsg(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '11px 20px', borderRadius: '12px',
                  border: '1.5px solid #E5E7EB', background: '#fff',
                  color: '#6B7280', fontWeight: 700, fontSize: '13px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <X size={14} /> Cancel
              </button>
            </>
          )}
        </div>
      </Card>

      {/* ── Section 2: Email Info ── */}
      <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Mail size={15} color="#16A34A" />
        <p style={{ margin: 0, fontSize: '12px', color: '#15803D', fontWeight: 600 }}>
          Your email address <strong>{user?.email}</strong> is verified and cannot be changed. Use "Forgot Password" if you lose access.
        </p>
      </div>

      {/* ── Section 3: Change Password ── */}
      <Card title="Change Password" icon={Shield}>
        {pwMsg && <Alert type={pwMsg.type} message={pwMsg.text} />}

        {pwMsg?.type === 'success' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              Redirecting you to login in 3 seconds…
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field
              label="Current Password"
              type={showPw.current ? 'text' : 'password'}
              value={pwForm.currentPassword}
              onChange={e => { setPwForm(p => ({ ...p, currentPassword: e.target.value })); setPwErrors(p => ({ ...p, currentPassword: '' })); }}
              placeholder="Enter your current password"
              error={pwErrors.currentPassword}
              endIcon={<PwBtn field="current" />}
              onEndClick={() => togglePw('current')}
              autoComplete="current-password"
            />
            <Field
              label="New Password"
              type={showPw.new ? 'text' : 'password'}
              value={pwForm.newPassword}
              onChange={e => { setPwForm(p => ({ ...p, newPassword: e.target.value })); setPwErrors(p => ({ ...p, newPassword: '' })); }}
              placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 special"
              error={pwErrors.newPassword}
              endIcon={<PwBtn field="new" />}
              onEndClick={() => togglePw('new')}
              autoComplete="new-password"
            />
            <Field
              label="Confirm New Password"
              type={showPw.confirm ? 'text' : 'password'}
              value={pwForm.confirm}
              onChange={e => { setPwForm(p => ({ ...p, confirm: e.target.value })); setPwErrors(p => ({ ...p, confirm: '' })); }}
              placeholder="Repeat your new password"
              error={pwErrors.confirm}
              endIcon={<PwBtn field="confirm" />}
              onEndClick={() => togglePw('confirm')}
              autoComplete="new-password"
            />

            {/* Password strength hints */}
            {pwForm.newPassword && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { ok: pwForm.newPassword.length >= 8, label: '8+ chars' },
                  { ok: /[A-Z]/.test(pwForm.newPassword), label: 'Uppercase' },
                  { ok: /[0-9]/.test(pwForm.newPassword), label: 'Number' },
                  { ok: /[@$!%*#?&^()_\-+=<>]/.test(pwForm.newPassword), label: 'Special char' },
                ].map(({ ok, label }) => (
                  <span key={label} style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '100px', background: ok ? '#F0FDF4' : '#F3F4F6', color: ok ? '#16A34A' : '#9CA3AF', border: `1px solid ${ok ? '#BBF7D0' : '#E5E7EB'}` }}>
                    {ok ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            )}

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFF7ED', border: '1px solid #FED7AA' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#C2410C', fontWeight: 600 }}>
                ⚠️ Changing your password will log you out from all other devices.
              </p>
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '13px', borderRadius: '14px', border: 'none',
                background: pwLoading ? '#FED7AA' : 'linear-gradient(135deg, #1E3A5F, #2D5282)',
                color: '#fff', fontWeight: 700, fontSize: '14px',
                cursor: pwLoading ? 'wait' : 'pointer', fontFamily: 'inherit',
                boxShadow: pwLoading ? 'none' : '0 4px 14px rgba(30,58,95,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              {pwLoading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Changing Password…</>
                : <><Lock size={15} /> Change Password</>}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
