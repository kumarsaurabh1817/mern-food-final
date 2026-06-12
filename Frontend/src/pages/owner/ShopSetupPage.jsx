import { useState, useEffect } from 'react';
import { Store, Clock, MapPin, Check, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

const CATEGORIES = ['Pizza', 'Burger', 'Biryani', 'Chinese', 'South Indian', 'Italian', 'Mexican', 'Desserts', 'Healthy', 'Fast Food', 'Seafood', 'Other'];

const emptyForm = { name: '', description: '', category: '', images: [''], address: { street: '', city: '', state: '', zipCode: '', country: 'India' }, deliveryRadiusKm: 5, operatingHours: { open: '09:00', close: '22:00' } };

export default function ShopSetupPage() {
  const dispatch = useDispatch();
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api.get('/shops/owner/me').then(({ data }) => {
      const s = data.shop || data;
      if (s?._id) {
        setShop(s);
        setForm({
          name: s.name || '', description: s.description || '',
          category: s.category || '', images: s.images?.length ? s.images : [''],
          address: s.address || emptyForm.address,
          deliveryRadiusKm: s.deliveryRadiusKm || 5,
          operatingHours: s.operatingHours || emptyForm.operatingHours,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const setField = (path, value) => {
    const parts = path.split('.');
    setForm((prev) => {
      const next = { ...prev };
      if (parts.length === 1) next[parts[0]] = value;
      else if (parts.length === 2) next[parts[0]] = { ...next[parts[0]], [parts[1]]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, images: form.images.filter(Boolean) };
      if (shop?._id) {
        const { data } = await api.patch(`/shops/${shop._id}`, payload);
        setShop(data.shop || data);
      } else {
        const { data } = await api.post('/shops', payload);
        setShop(data.shop || data);
      }
      dispatch(showToast({ message: 'Shop saved!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to save shop', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async () => {
    if (!shop?._id) return;
    setToggling(true);
    try {
      const { data } = await api.patch(`/shops/${shop._id}/toggle-open`);
      setShop((prev) => ({ ...prev, isOpen: data.isOpen ?? !prev.isOpen }));
      dispatch(showToast({ message: `Shop is now ${data.isOpen ? 'open' : 'closed'}`, type: 'info' }));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to toggle shop status', type: 'error' }));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Shop Setup</h1>
          <p className="text-gray-400 text-sm mt-1">{shop?._id ? 'Manage your restaurant details' : 'Create your restaurant listing'}</p>
        </div>
        {shop?._id && (
          <button onClick={toggleOpen} disabled={toggling} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${shop.isOpen ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {shop.isOpen ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {shop.isOpen ? 'Open' : 'Closed'}
          </button>
        )}
      </div>

      {shop?._id && !shop.isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
          Your shop is pending admin approval. It will appear publicly once approved.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Store className="w-4 h-4 text-orange-400" /> Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Restaurant name *</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} required placeholder="e.g. The Spice Garden" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} placeholder="Tell customers what makes your restaurant special..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Category / Cuisine</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400">
                <option value="">Select cuisine type</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Image URL</label>
              <input value={form.images[0] || ''} onChange={(e) => setForm((prev) => ({ ...prev, images: [e.target.value] }))} placeholder="https://example.com/restaurant.jpg" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" /> Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Street address *</label>
              <input value={form.address.street} onChange={(e) => setField('address.street', e.target.value)} required placeholder="123 Main Street" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">City *</label>
              <input value={form.address.city} onChange={(e) => setField('address.city', e.target.value)} required placeholder="Mumbai" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">State *</label>
              <input value={form.address.state} onChange={(e) => setField('address.state', e.target.value)} required placeholder="Maharashtra" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">ZIP Code *</label>
              <input value={form.address.zipCode} onChange={(e) => setField('address.zipCode', e.target.value)} required placeholder="400001" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Delivery radius (km)</label>
              <input type="number" min="1" max="50" value={form.deliveryRadiusKm} onChange={(e) => setField('deliveryRadiusKm', Number(e.target.value))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
        </div>

        {/* Operating hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400" /> Operating Hours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Opening time</label>
              <input type="time" value={form.operatingHours.open} onChange={(e) => setField('operatingHours.open', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Closing time</label>
              <input type="time" value={form.operatingHours.close} onChange={(e) => setField('operatingHours.close', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {shop?._id ? 'Save changes' : 'Create shop'}
        </button>
      </form>
    </div>
  );
}
