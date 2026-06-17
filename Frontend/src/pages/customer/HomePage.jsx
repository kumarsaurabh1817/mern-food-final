import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, ChevronRight, TrendingUp, Zap, UtensilsCrossed } from 'lucide-react';
import api from '../../lib/axios';

const CATEGORIES = ['All', 'Pizza', 'Burger', 'Biryani', 'Chinese', 'South Indian', 'Desserts', 'Healthy'];

const HERO_IMAGES = [
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

export default function HomePage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/shops').then(({ data }) => setShops(data.shops || data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const featured = shops.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={HERO_IMAGES[0]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-4 h-4" /> Fast delivery in 30 mins
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Hungry? We've got <br className="hidden sm:block" />you covered
          </h1>
          <p className="text-orange-100 text-lg mb-8">Order from hundreds of restaurants near you</p>
          <form onSubmit={handleSearch} className="max-w-lg mx-auto">
            <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-xl shadow-orange-900/20">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants or dishes..."
                  className="flex-1 outline-none text-gray-800 text-sm placeholder:text-gray-400"
                />
              </div>
              <button type="submit" className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Category chips */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: UtensilsCrossed, label: 'Restaurants', value: '500+', color: 'bg-orange-50 text-orange-500' },
            { icon: TrendingUp, label: 'Orders Today', value: '12k+', color: 'bg-green-50 text-green-500' },
            { icon: Zap, label: 'Avg Delivery', value: '30 min', color: 'bg-blue-50 text-blue-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-black text-gray-900">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Featured Restaurants */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Featured Restaurants</h2>
            <button onClick={() => navigate('/restaurants')} className="flex items-center gap-1 text-sm text-orange-500 font-medium hover:text-orange-600">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((shop) => (
                <ShopCard key={shop._id} shop={shop} />
              ))}
              {featured.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No restaurants available right now</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const ShopCard = memo(function ShopCard({ shop }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/restaurant/${shop._id}`)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={shop.images?.[0] || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600'}
          loading="lazy"
          decoding="async"
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!shop.isOpen && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">Closed</span>
          </div>
        )}
        {shop.category && (
          <span className="absolute top-3 left-3 bg-white text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {shop.category}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base truncate">{shop.name}</h3>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{shop.address?.city}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 4.2</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 25-35 min</span>
          <span className={`ml-auto px-2 py-0.5 rounded-full font-medium ${shop.isOpen ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {shop.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>
    </div>
  );
});
