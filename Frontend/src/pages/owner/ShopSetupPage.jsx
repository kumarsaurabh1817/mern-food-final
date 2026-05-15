import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../lib/axios';
import { showToast } from '../../features/ui/uiSlice';
import { Store, Save, ToggleLeft, ToggleRight, Loader } from 'lucide-react';

const CATEGORIES = ['Indian', 'Chinese', 'Fast Food', 'Pizza', 'Biryani', 'Desserts', 'Beverages', 'Other'];

export default function ShopSetupPage() {
  const dispatch = useDispatch();
  const { shop: layoutShop, setShop: setLayoutShop } = useOutletContext() || {};
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category: 'Indian',
    street: '', city: '', state: '',
    delivery_radius_km: 5,
    operating_hours_open: '09:00',
    operating_hours_close: '22:00',
  });

  useEffect(() => { fetchShop(); }, []);

  useEffect(() => {
    if (!layoutShop && layoutShop !== null) return;
    if (!layoutShop) {
      setShop(null);
      return;
    }
    setShop(prev => {
      if (!prev) return layoutShop;
      const prevId = prev._id || prev.id;
      const nextId = layoutShop._id || layoutShop.id;
      if (prevId && nextId && prevId === nextId) {
        return { ...prev, isOpen: layoutShop.isOpen, isApproved: layoutShop.isApproved };
      }
      return layoutShop;
    });
  }, [layoutShop]);

  const fetchShop = async () => {
    try {
      const { data } = await api.get('/shops/owner/me');
      if (data.success && data.shop) {
        const s = data.shop;
        setShop(s);
        if (setLayoutShop) setLayoutShop(s);
        setForm({
          name: s.name || '', description: s.description || '', category: s.category || 'Indian',
          street: s.address?.street || '', city: s.address?.city || '', state: s.address?.state || '',
          delivery_radius_km: s.deliveryRadiusKm || 5,
          operating_hours_open: s.operatingHours?.open || '09:00',
          operating_hours_close: s.operatingHours?.close || '22:00',
        });
      } else if (setLayoutShop) {
        setLayoutShop(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name, description: form.description, category: form.category,
      address: { street: form.street, city: form.city, state: form.state, zipCode: '000000', country: 'India' },
      deliveryRadiusKm: form.delivery_radius_km,
      operatingHours: { open: form.operating_hours_open, close: form.operating_hours_close },
    };
    try {
      if (shop) {
        const { data } = await api.patch(`/shops/${shop._id || shop.id}`, payload);
        if (data.success) { dispatch(showToast({ message: 'Shop updated!', type: 'success' })); fetchShop(); }
        else dispatch(showToast({ message: data.message || 'Error updating shop', type: 'error' }));
      } else {
        const { data } = await api.post('/shops', payload);
        if (data.success) { dispatch(showToast({ message: 'Shop created! Awaiting admin approval.', type: 'success' })); fetchShop(); }
        else dispatch(showToast({ message: data.message || 'Error creating shop', type: 'error' }));
      }
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || error.message, type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async () => {
    if (!shop) return;
    try {
      const { data } = await api.patch(`/shops/${shop._id || shop.id}/toggle-open`);
      if (data.success) {
        const isOpen = !!data.isOpen;
        setShop(prev => (prev ? { ...prev, isOpen } : prev));
        if (setLayoutShop) {
          setLayoutShop(prev => (prev ? { ...prev, isOpen } : prev));
        }
        dispatch(showToast({ message: isOpen ? 'Shop opened' : 'Shop closed', type: 'success' }));
      }
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || error.message, type: 'error' }));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#FF7A00', borderRadius: '50%' }} className="animate-spin" />
    </div>
  );

  const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', display: 'block' };
  const sectionTitle = { fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' };

  return (
    <div className="owner-page owner-page-narrow">
      {/* Header */}
      <div className="owner-header">
        <div>
          <h1 className="owner-title">My Shop</h1>
          <p className="owner-subtitle">{shop ? 'Manage your restaurant details' : 'Set up your restaurant'}</p>
        </div>
        {shop && (
          <button onClick={toggleOpen}
            className={`owner-chip ${shop.isOpen ? 'owner-chip-success' : 'owner-chip-danger'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>
            {shop.isOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {shop.isOpen ? 'Open' : 'Closed'}
          </button>
        )}
      </div>

      {/* Pending approval banner */}
      {shop && !shop.isApproved && (
        <div className="owner-alert">
          ⚠️ Your shop is pending admin approval. You can still set it up, and it will go live once approved.
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Basic Info */}
        <div className="owner-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={sectionTitle}><Store size={16} color="#FF7A00" /> Basic Info</h3>
          <div>
            <label style={labelStyle}>Restaurant Name *</label>
            <input required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field" placeholder="e.g., Spice Garden" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input-field" rows={3} style={{ resize: 'none' }}
              placeholder="Tell customers about your restaurant..." />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="input-field">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="owner-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={sectionTitle}>📍 Location</h3>
          <div>
            <label style={labelStyle}>Street Address</label>
            <input value={form.street}
              onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
              className="input-field" placeholder="123 Main St" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="input-field" placeholder="Mumbai" />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input value={form.state}
                onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                className="input-field" placeholder="Maharashtra" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Delivery Radius (km)</label>
            <input type="number" min={0} max={80000}
              value={form.delivery_radius_km}
              onChange={e => setForm(p => ({ ...p, delivery_radius_km: +e.target.value }))}
              className="input-field" />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="owner-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={sectionTitle}>🕐 Operating Hours</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Opens At</label>
              <input type="time" value={form.operating_hours_open}
                onChange={e => setForm(p => ({ ...p, operating_hours_open: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label style={labelStyle}>Closes At</label>
              <input type="time" value={form.operating_hours_close}
                onChange={e => setForm(p => ({ ...p, operating_hours_close: e.target.value }))}
                className="input-field" />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button type="submit" disabled={saving} className="btn-primary"
          style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}>
          {saving
            ? <><Loader size={16} className="animate-spin" /> Saving...</>
            : <><Save size={15} />{shop ? 'Save Changes' : 'Create Shop'}</>
          }
        </button>
      </form>
    </div>
  );
}
