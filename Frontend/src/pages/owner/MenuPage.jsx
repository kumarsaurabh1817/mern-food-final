import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../lib/axios';
import { showToast } from '../../features/ui/uiSlice';
import { Plus, Pencil, Trash2, Loader, UtensilsCrossed, X, Store } from 'lucide-react';

const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Rice', 'Beverages', 'Desserts', 'Extras'];
const FOOD_IMG = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200';
const emptyForm = { name: '', description: '', price: '', category: 'Main Course', isVeg: true, isAvailable: true, image: '' };

function MenuItemForm({ form, setForm, onSave, onCancel, saving }) {
  return (
    <div className="owner-modal">
      <div className="owner-card owner-modal-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
            {form._id || form.id ? 'Edit Item' : 'Add Menu Item'}
          </h3>
          <button onClick={onCancel} className="owner-icon-btn"><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', display: 'block' }}>Name *</label>
            <input required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field" placeholder="Butter Chicken" />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', display: 'block' }}>Description</label>
            <textarea value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input-field" rows={2} style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', display: 'block' }}>Price (₹) *</label>
              <input type="number" required min={0} value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', display: 'block' }}>Category</label>
              <select value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', display: 'block' }}>Image URL (optional)</label>
            <input value={form.image}
              onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
              className="input-field" placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
              <input type="checkbox" checked={form.isVeg}
                onChange={e => setForm(p => ({ ...p, isVeg: e.target.checked }))} />
              Vegetarian
              <span style={{ width: '14px', height: '14px', border: `2px solid ${form.isVeg ? '#22C55E' : '#D1D5DB'}`, borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: form.isVeg ? '#22C55E' : 'transparent' }} />
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
              <input type="checkbox" checked={form.isAvailable}
                onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} />
              Available
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} className="btn-ghost" style={{ flex: 1, padding: '11px 14px' }}>Cancel</button>
          <button onClick={onSave} disabled={saving || !form.name || !form.price}
            className="btn-primary" style={{ flex: 1, padding: '11px 14px' }}>
            {saving ? <Loader size={14} className="animate-spin" /> : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const dispatch = useDispatch();
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/shops/owner/me');
      if (data.success && data.shop) {
        setShop(data.shop);
        setItems(data.shop.menu || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      if (form._id || form.id) {
        const { data } = await api.patch(`/shops/${shop._id || shop.id}/menu/${form._id || form.id}`, { ...form, price: +form.price });
        if (data.success) { dispatch(showToast({ message: 'Item updated', type: 'success' })); fetchData(); setShowForm(false); }
        else dispatch(showToast({ message: data.message || 'Error updating item', type: 'error' }));
      } else {
        const { data } = await api.post(`/shops/${shop._id || shop.id}/menu`, { ...form, price: +form.price });
        if (data.success) { dispatch(showToast({ message: 'Item added', type: 'success' })); fetchData(); setShowForm(false); }
        else dispatch(showToast({ message: data.message || 'Error adding item', type: 'error' }));
      }
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error saving item', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvail = async (item) => {
    try {
      await api.patch(`/shops/${shop._id || shop.id}/menu/${item._id || item.id}/toggle-stock`);
      fetchData();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error toggling availability', type: 'error' }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/shops/${shop._id || shop.id}/menu/${id}`);
      dispatch(showToast({ message: 'Item deleted', type: 'success' }));
      fetchData();
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error deleting item', type: 'error' }));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#FF7A00', borderRadius: '50%' }} className="animate-spin" />
    </div>
  );

  if (!shop) {
    return (
      <div className="owner-page">
        <div className="owner-header">
          <div>
            <h1 className="owner-title">Menu</h1>
            <p className="owner-subtitle">Create your shop to start adding menu items</p>
          </div>
        </div>
        <div className="owner-card owner-empty">
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #FFF7ED, #FFE8D6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            border: '1px solid #FED7AA',
          }}>
            <Store size={26} color="#FF7A00" />
          </div>
          <p style={{ fontWeight: 800, color: '#1A1A1A', marginBottom: '6px' }}>No shop found</p>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
            Set up your restaurant to unlock menu management and start selling.
          </p>
          <Link
            to="/owner/shop"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            Create Shop
          </Link>
        </div>
      </div>
    );
  }

  const grouped = items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="owner-page">
      {showForm && (
        <MenuItemForm form={form} setForm={setForm} onSave={handleSave}
          onCancel={() => { setShowForm(false); setForm(emptyForm); }} saving={saving} />
      )}

      <div className="owner-header">
        <div>
          <h1 className="owner-title">Menu</h1>
          <p className="owner-subtitle">{items.length} items across {Object.keys(grouped).length} categories</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="owner-card owner-empty">
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <UtensilsCrossed size={24} color="#FF7A00" />
          </div>
          <p style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>No menu items yet</p>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>Add your first item to get started</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>{cat}</p>
            <div className="owner-list">
              {catItems.map(item => (
                <div key={item._id || item.id} className="owner-list-item" style={{ opacity: item.isAvailable ? 1 : 0.55 }}>
                  <img src={item.image || FOOD_IMG} alt={item.name}
                    style={{ width: '54px', height: '54px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E5E7EB' }}
                    onError={e => { e.target.src = FOOD_IMG; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      {/* Veg/Non-veg indicator */}
                      <span style={{ width: '14px', height: '14px', border: `2px solid ${item.isVeg ? '#22C55E' : '#EF4444'}`, borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.isVeg ? '#22C55E' : '#EF4444' }} />
                      </span>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{item.name}</p>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#FF7A00', margin: 0 }}>₹{item.price}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => handleToggleAvail(item)}
                      className={`owner-chip ${item.isAvailable ? 'owner-chip-success' : 'owner-chip-danger'}`}
                      style={{ cursor: 'pointer' }}>
                      {item.isAvailable ? 'In Stock' : 'Out'}
                    </button>
                    <button onClick={() => { setForm({ ...item }); setShowForm(true); }} className="owner-icon-btn">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(item._id || item.id)} className="owner-icon-btn owner-icon-btn-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
