import { useState, useEffect } from 'react';
import { Store, CheckCircle, PauseCircle, PlayCircle, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

const STATUS_FILTER = ['all', 'pending', 'approved', 'suspended'];

export default function AdminShopsPage() {
  const dispatch = useDispatch();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioning, setActioning] = useState(null);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter !== 'all') params.set('status', filter);
      if (committedSearch) params.set('search', committedSearch);
      const { data } = await api.get(`/admin/shops?${params}`);
      setShops(data.shops || data || []);
      setTotalPages(data.totalPages || 1);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, [filter, page, committedSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setCommittedSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setCommittedSearch('');
    setPage(1);
  };

  const action = async (shopId, endpoint, msg) => {
    setActioning(shopId + endpoint);
    try {
      await api.patch(endpoint);
      dispatch(showToast({ message: msg, type: 'success' }));
      fetchShops();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Action failed', type: 'error' }));
    } finally {
      setActioning(null);
    }
  };

  const getStatusBadge = (shop) => {
    if (shop.isSuspended) return { label: 'Suspended', cls: 'bg-red-50 text-red-600 border-red-200' };
    if (!shop.isApproved) return { label: 'Pending', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    return { label: 'Approved', cls: 'bg-green-50 text-green-600 border-green-200' };
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Shop Management</h1>
        <p className="text-gray-400 text-sm mt-1">Approve restaurants and manage shop status</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search shops by name, category or city..."
              className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            )}
          </div>
          <button type="submit" className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600">Search</button>
        </form>
        <div className="flex gap-1">
          {STATUS_FILTER.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}</div>
      ) : shops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Store className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No shops found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => {
            const badge = getStatusBadge(shop);
            return (
              <div key={shop._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                {shop.images?.[0] ? (
                  <img src={shop.images[0]} alt={shop.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Store className="w-6 h-6 text-orange-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 truncate">{shop.name}</p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{shop.category} • {shop.address?.city}</p>
                  <p className="text-xs text-gray-400">Owner: {shop.owner?.name || shop.owner?.email || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!shop.isApproved && !shop.isSuspended && (
                    <button
                      onClick={() => action(shop._id, `/admin/shops/${shop._id}/approve`, 'Shop approved!')}
                      disabled={!!actioning}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
                    >
                      {actioning === shop._id + `/admin/shops/${shop._id}/approve` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  )}
                  {shop.isApproved && (
                    <button
                      onClick={() => action(shop._id, `/admin/shops/${shop._id}/suspend`, shop.isSuspended ? 'Shop reinstated!' : 'Shop suspended')}
                      disabled={!!actioning}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-50 ${shop.isSuspended ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                    >
                      {shop.isSuspended ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                      {shop.isSuspended ? 'Reinstate' : 'Suspend'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
