import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Check, Loader2, Leaf } from 'lucide-react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

const emptyItem = { name: '', description: '', price: '', category: '', image: '', isVeg: true, isAvailable: true };

export default function MenuPage() {
  const dispatch = useDispatch();
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    api.get('/shops/owner/me').then(({ data }) => {
      // /shops/owner/me uses the same aggregation pipeline as /shops/:id
      // so it already returns shop.menu embedded — no second request needed
      const s = data.shop || data;
      if (s?._id) {
        setShop(s);
        setItems(s.menu || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(items.map((i) => i.category).filter(Boolean))];
  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  const openAdd = () => { setForm(emptyItem); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item, price: String(item.price) }); setModal('edit'); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shop?._id) return;
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (modal === 'edit' && form._id) {
        const { data } = await api.patch(`/shops/${shop._id}/menu/${form._id}`, payload);
        // Backend returns { menuItems: [...] } — full updated list
        setItems(data.menuItems || items);
      } else {
        const { data } = await api.post(`/shops/${shop._id}/menu`, payload);
        // Backend returns { menuItems: [...] } — full updated list
        setItems(data.menuItems || items);
      }
      setModal(null);
      dispatch(showToast({ message: `Item ${modal === 'edit' ? 'updated' : 'added'}!`, type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to save item', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!shop?._id || !confirm('Delete this item?')) return;
    try {
      const { data } = await api.delete(`/shops/${shop._id}/menu/${itemId}`);
      // Backend returns { menuItems: [...] } — full updated list
      setItems(data.menuItems || items.filter((i) => i._id !== itemId));
      dispatch(showToast({ message: 'Item deleted', type: 'info' }));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to delete item', type: 'error' }));
    }
  };

  const toggleStock = async (item) => {
    if (!shop?._id) return;
    try {
      const { data } = await api.patch(`/shops/${shop._id}/menu/${item._id}/toggle-stock`);
      setItems((prev) => prev.map((i) => i._id === item._id ? { ...i, isAvailable: data.isAvailable ?? !i.isAvailable } : i));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to toggle stock', type: 'error' }));
    }
  };

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}</div>;

  if (!shop?._id) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="text-amber-700 font-semibold">Please set up your shop first before adding menu items.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Menu</h1>
          <p className="text-gray-400 text-sm">{items.filter((i) => !i.isDeleted).length} items</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.filter((i) => !i.isDeleted).length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">No items yet. Add your first menu item!</p>
          <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">Add item</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.filter((i) => !i.isDeleted).map((item) => (
            <div key={item._id} className={`bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm ${!item.isAvailable ? 'opacity-60' : ''}`}>
              {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 border-2 rounded-sm flex-shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`} />
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  {!item.isAvailable && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Out of stock</span>}
                </div>
                {item.category && <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>}
                <p className="text-orange-500 font-bold mt-1">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => toggleStock(item)} title="Toggle availability"
                  className={`p-2 rounded-xl transition-colors ${item.isAvailable ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {item.isAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => openEdit(item)} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item._id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{modal === 'edit' ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Chicken Biryani" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Price (₹) *</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="199" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Main Course" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Image URL</label>
                  <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="accent-green-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Leaf className="w-4 h-4 text-green-500" /> Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">In stock</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {modal === 'edit' ? 'Update' : 'Add item'}
                </button>
                <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
