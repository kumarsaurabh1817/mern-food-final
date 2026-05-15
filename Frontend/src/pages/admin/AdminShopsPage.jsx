import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import { CheckCircle, AlertOctagon, Search, MapPin, Filter, Store } from 'lucide-react';

const SHOP_IMG = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200';

export default function AdminShopsPage() {
  const dispatch = useDispatch();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    try {
      const { data } = await api.get('/admin/shops?limit=1000');
      if (data.success) {
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id, name) => {
    setActionLoading(id);
    try {
      const { data } = await api.patch(`/admin/shops/${id}/approve`);
      if (data.success) {
        dispatch(showToast({ message: `${name} approved!`, type: 'success' }));
        fetchShops();
      }
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error approving shop', type: 'error' }));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSuspend = async (id, name, isSuspended) => {
    setActionLoading(id);
    try {
      const { data } = await api.patch(`/admin/shops/${id}/suspend`);
      if (data.success) {
        dispatch(showToast({ message: `${name} ${isSuspended ? 'reinstated' : 'suspended'}`, type: 'success' }));
        fetchShops();
      }
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error suspending shop', type: 'error' }));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = shops.filter(s => {
    const term = search.toLowerCase();
    const name = (s.name || '').toLowerCase();
    const city = (s.address?.city || s.city || '').toLowerCase();
    const matchSearch = !search || name.includes(term) || city.includes(term);
    if (filter === 'pending') return matchSearch && !(s.isApproved || s.is_approved);
    if (filter === 'suspended') return matchSearch && (s.isSuspended || s.is_suspended);
    if (filter === 'active') return matchSearch && (s.isApproved || s.is_approved) && !(s.isSuspended || s.is_suspended);
    return matchSearch;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-10 font-sans">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all"
            placeholder="Search shops..." />
        </div>
        <div className="relative min-w-[200px]">
          <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 appearance-none focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all">
            <option value="all">All Shops</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
           <Store className="mx-auto h-12 w-12 text-gray-300 mb-3" />
           <p className="text-gray-400 font-bold uppercase tracking-wider">No shops found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(shop => (
            <div key={shop._id || shop.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all group">
              <div className="relative h-40 bg-gray-100 overflow-hidden">
                <img src={shop.images?.[0] || shop.imageUrl || SHOP_IMG} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { e.target.src = SHOP_IMG; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-extrabold text-xl tracking-tight truncate">{shop.name}</p>
                  <p className="text-white/80 font-semibold text-sm truncate uppercase tracking-wider mt-0.5">{shop.cuisineType?.[0] || shop.category}</p>
                </div>
                <div className="absolute top-3 right-3">
                  {shop.isSuspended || shop.is_suspended ? (
                    <span className="bg-red-500 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg shadow-sm">Suspended</span>
                  ) : shop.isApproved || shop.is_approved ? (
                    <span className="bg-green-500 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg shadow-sm">Active</span>
                  ) : (
                    <span className="bg-amber-500 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg shadow-sm">Pending</span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mb-5">
                  <span className="flex items-center gap-1.5 truncate"><MapPin size={12} className="text-gray-400" />{shop.address?.city || shop.city || 'N/A'}</span>
                </div>
                <div className="flex gap-3">
                  {!(shop.isApproved || shop.is_approved) && !(shop.isSuspended || shop.is_suspended) && (
                    <button onClick={() => approve(shop._id || shop.id, shop.name)} disabled={actionLoading === (shop._id || shop.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                  <button onClick={() => toggleSuspend(shop._id || shop.id, shop.name, shop.isSuspended || shop.is_suspended)} disabled={actionLoading === (shop._id || shop.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      shop.isSuspended || shop.is_suspended ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-red-50 hover:bg-red-100 text-red-600'
                    }`}>
                    <AlertOctagon size={14} /> {shop.isSuspended || shop.is_suspended ? 'Reinstate' : 'Suspend'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
