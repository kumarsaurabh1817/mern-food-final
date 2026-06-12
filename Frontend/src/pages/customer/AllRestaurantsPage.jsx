import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Clock, SlidersHorizontal, UtensilsCrossed, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'delivery_time', label: 'Delivery Time' },
];

export default function AllRestaurantsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const endpoint = q ? `/shops/search?q=${encodeURIComponent(q)}` : `/shops?page=${page}&limit=12&sort=${sort}`;
      const { data } = await api.get(endpoint);
      setShops(data.shops || data || []);
      setTotalPages(data.totalPages || 1);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, [searchParams, page, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Search bar + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants or cuisines..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button type="submit" className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">Search</button>
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {searchParams.get('q') && (
        <p className="text-gray-500 text-sm mb-5">
          Results for "<strong className="text-gray-800">{searchParams.get('q')}</strong>" — {shops.length} restaurant{shops.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2"><div className="h-4 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No restaurants found</h3>
          <p className="text-gray-400 text-sm">Try a different search term or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {shops.map((shop) => (
            <div
              key={shop._id}
              onClick={() => navigate(`/restaurant/${shop._id}`)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={shop.images?.[0] || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={shop.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!shop.isOpen && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">Closed</span></div>}
                {shop.category && <span className="absolute top-3 left-3 bg-white text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">{shop.category}</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate">{shop.name}</h3>
                <p className="text-gray-400 text-xs mt-0.5 truncate">{shop.address?.city}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {shop.deliveryRadiusKm > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {shop.deliveryRadiusKm} km radius</span>}
                  <span className={`ml-auto px-2 py-0.5 rounded-full font-medium ${shop.isOpen ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{shop.isOpen ? 'Open' : 'Closed'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
