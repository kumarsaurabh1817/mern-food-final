import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import { showToast } from '../../features/ui/uiSlice';
import {
  User, Lock, Store, Check, Loader2, Shield, Calendar,
  Phone, Mail, BadgeCheck, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

const TABS = [
  { id: 'profile', label: 'Account', icon: User },
  { id: 'shop', label: 'My Shop', icon: Store },
  { id: 'password', label: 'Password', icon: Lock },
];

export default function OwnerProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [tab, setTab] = useState('profile');

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Shop data
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', phone: user.phone || '' });
    api.get('/shops/owner/me')
      .then(({ data }) => setShop(data.shop || data))
      .catch(() => {})
      .finally(() => setShopLoading(false));
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.patch('/users/me', profileForm);
      dispatch(showToast({ message: 'Profile updated successfully!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Update failed', type: 'error' }));
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    if (pwForm.newPassword.length < 8) errs.newPassword = 'Minimum 8 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwLoading(true);
    try {
      await api.post('/users/me/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      dispatch(showToast({ message: 'Password changed successfully!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to change password', type: 'error' }));
    } finally {
      setPwLoading(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and shop settings</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200">
          <span className="text-white font-black text-2xl">{user?.name?.[0]?.toUpperCase() || 'O'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-gray-900">{user?.name}</h2>
          <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2.5 py-0.5 rounded-full capitalize">Restaurant Owner</span>
            {user?.isApprovedByAdmin ? (
              <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Pending Approval
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end text-right gap-1">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Member since
          </p>
          <p className="text-sm font-semibold text-gray-700">{memberSince}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-gray-900">Personal Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </form>
      )}

      {/* Shop Info Tab */}
      {tab === 'shop' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">My Restaurant</h3>
          {shopLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : !shop?._id ? (
            <div className="text-center py-10">
              <Store className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No shop set up yet</p>
              <p className="text-sm text-gray-400 mt-1">Go to Shop Setup to create your restaurant</p>
              <Link
                to="/owner/shop"
                className="inline-block mt-4 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Set up Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{shop.name}</p>
                  <p className="text-sm text-gray-500">{shop.category}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${shop.isApproved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {shop.isApproved ? '✓ Approved' : '⏳ Pending Approval'}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${shop.isOpen ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {shop.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </span>
                    {shop.isSuspended && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600">Suspended</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'City', value: shop.address?.city },
                  { label: 'State', value: shop.address?.state },
                  { label: 'Delivery Radius', value: `${shop.deliveryRadiusKm} km` },
                  { label: 'Operating Hours', value: `${shop.operatingHours?.open} – ${shop.operatingHours?.close}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-800">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {shop.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{shop.description}</p>
                </div>
              )}

              <Link
                to="/owner/shop"
                className="flex items-center justify-center gap-2 w-full border border-orange-200 text-orange-500 hover:bg-orange-50 font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                <Store className="w-4 h-4" /> Edit shop details
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Change Password</h3>
              <p className="text-xs text-gray-400">Min 8 chars, 1 uppercase, 1 number, 1 special character</p>
            </div>
          </div>

          {[
            { name: 'currentPassword', label: 'Current password', key: 'current' },
            { name: 'newPassword', label: 'New password', key: 'new' },
            { name: 'confirmPassword', label: 'Confirm new password', key: 'confirm' },
          ].map(({ name, label, key }) => (
            <div key={name}>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  value={pwForm[name]}
                  onChange={(e) => { setPwForm({ ...pwForm, [name]: e.target.value }); setPwErrors({ ...pwErrors, [name]: '' }); }}
                  className={`w-full pl-10 pr-11 py-2.5 border rounded-xl text-sm focus:outline-none ${
                    pwErrors[name] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwErrors[name] && <p className="text-xs text-red-500 mt-1">{pwErrors[name]}</p>}
            </div>
          ))}

          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
