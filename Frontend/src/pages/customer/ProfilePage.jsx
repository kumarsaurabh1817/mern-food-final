import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import { User, MapPin, Lock, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'password', label: 'Password', icon: Lock },
];

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrForm, setAddrForm] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', phone: user.phone || '' });
    api.get('/users/me/addresses').then(({ data }) => setAddresses(data.addresses || [])).catch(() => {}).finally(() => setAddrLoading(false));
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.patch('/users/me', profileForm);
      dispatch(showToast({ message: 'Profile updated!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Update failed', type: 'error' }));
    } finally {
      setProfileLoading(false);
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      if (addrForm._id) {
        const { data } = await api.patch(`/users/me/addresses/${addrForm._id}`, addrForm);
        setAddresses(data.addresses || []);
      } else {
        const { data } = await api.post('/users/me/addresses', addrForm);
        setAddresses(data.addresses || []);
      }
      setAddrForm(null);
      dispatch(showToast({ message: 'Address saved!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to save address', type: 'error' }));
    }
  };

  const deleteAddress = async (id) => {
    try {
      const { data } = await api.delete(`/users/me/addresses/${id}`);
      setAddresses(data.addresses || []);
      dispatch(showToast({ message: 'Address removed', type: 'info' }));
    } catch (_) {
      dispatch(showToast({ message: 'Failed to delete address', type: 'error' }));
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    if (pwForm.newPassword.length < 8) errs.newPassword = 'Min 8 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwLoading(true);
    try {
      await api.post('/users/me/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      dispatch(showToast({ message: 'Password changed!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to change password', type: 'error' }));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">{user?.name}</h1>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <span className="text-xs bg-orange-50 text-orange-500 font-medium px-2 py-0.5 rounded-full mt-1 inline-block capitalize">{user?.role?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
            <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone number</label>
            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 9876543210" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
            <input value={user?.email || ''} disabled className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400" />
          </div>
          <button type="submit" disabled={profileLoading} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-60">
            {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save changes
          </button>
        </form>
      )}

      {/* Addresses tab */}
      {tab === 'addresses' && (
        <div className="space-y-3">
          {addrLoading ? <p className="text-gray-400 text-sm text-center py-8">Loading...</p> : (
            <>
              {addresses.map((addr) => (
                <div key={addr._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  {addrForm?._id === addr._id ? (
                    <form onSubmit={saveAddress} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Label" value={addrForm.label || ''} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                        <input placeholder="Street" value={addrForm.street || ''} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} required className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                        <input placeholder="City" value={addrForm.city || ''} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                        <input placeholder="State" value={addrForm.state || ''} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                        <input placeholder="ZIP" value={addrForm.zipCode || ''} onChange={(e) => setAddrForm({ ...addrForm, zipCode: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600"><Check className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setAddrForm(null)} className="text-gray-400 px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200"><X className="w-4 h-4" /></button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{addr.label || 'Address'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setAddrForm({ ...addr })} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteAddress(addr._id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {addrForm && !addrForm._id && (
                <form onSubmit={saveAddress} className="bg-white rounded-2xl border border-orange-200 p-4 shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Label (Home, Work...)" value={addrForm.label || ''} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                    <input placeholder="Street address" value={addrForm.street || ''} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} required className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                    <input placeholder="City" value={addrForm.city || ''} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                    <input placeholder="State" value={addrForm.state || ''} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                    <input placeholder="ZIP Code" value={addrForm.zipCode || ''} onChange={(e) => setAddrForm({ ...addrForm, zipCode: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
                    <button type="button" onClick={() => setAddrForm(null)} className="text-gray-400 px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200">Cancel</button>
                  </div>
                </form>
              )}
              {!addrForm && (
                <button onClick={() => setAddrForm({ label: '', street: '', city: '', state: '', zipCode: '' })} className="w-full border border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add new address
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          {[
            { name: 'currentPassword', label: 'Current password' },
            { name: 'newPassword', label: 'New password' },
            { name: 'confirmPassword', label: 'Confirm new password' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
              <input type="password" value={pwForm[name]} onChange={(e) => { setPwForm({ ...pwForm, [name]: e.target.value }); setPwErrors({ ...pwErrors, [name]: '' }); }}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none ${pwErrors[name] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'}`} />
              {pwErrors[name] && <p className="text-xs text-red-500 mt-1">{pwErrors[name]}</p>}
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-60">
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update password
          </button>
        </form>
      )}
    </div>
  );
}
