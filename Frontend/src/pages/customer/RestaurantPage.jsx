import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../lib/axios';
import { addItem } from '../../features/cart/cartSlice';
import { showClearCartModal, showToast } from '../../features/ui/uiSlice';
import { ArrowLeft, Clock, MapPin, ShoppingCart, Info, Search, Heart, Share2 } from 'lucide-react';

const FOOD_IMG = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';


function MenuItemCard({ item, shopId, shopName }) {
  const dispatch = useDispatch();
  const cart = useSelector(s => s.cart);
  const itemId = item._id || item.id;
  const cartItem = cart.items.find(i => (i._id || i.id) === itemId);
  const quantity = cartItem?.quantity || 0;
  const isAvailable = item.isAvailable ?? item.is_available ?? true;
  const isVeg = item.isVeg ?? item.is_veg ?? true;

  const handleAdd = () => {
    if (cart.shopId && cart.shopId !== shopId && cart.items.length > 0) {
      dispatch(showClearCartModal({
        item: {
          id: itemId,
          _id: itemId,
          name: item.name,
          price: item.price,
          image: item.image,
          is_veg: item.isVeg ?? item.is_veg
        },
        shopId,
        shopName
      }));
      return;
    }
    dispatch(addItem({
      item: {
        id: itemId,
        _id: itemId,
        name: item.name,
        price: item.price,
        image: item.image,
        is_veg: item.isVeg ?? item.is_veg
      },
      shopId,
      shopName
    }));
    dispatch(showToast({ message: `${item.name} added to cart`, type: 'success' }));
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md ${!isAvailable ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${isVeg ? 'border-blue-600' : 'border-red-600'}`}>
              <span className={`h-2 w-2 rounded-full ${isVeg ? 'bg-blue-600' : 'bg-red-600'}`} />
            </span>
            <h4 className="text-lg font-extrabold text-slate-900 truncate">{item.name}</h4>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-500 line-clamp-2">
            {item.description || 'Freshly prepared, packed with flavor.'}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xl font-black text-slate-900">₹{item.price}</p>
            </div>
            {quantity > 0 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-600">
                In cart {quantity}
              </span>
            )}
          </div>
        </div>

        <div className="relative w-28 h-28 shrink-0">
          <img
            src={item.image || FOOD_IMG}
            alt={item.name}
            className="h-full w-full rounded-2xl object-cover shadow-sm"
            onError={e => { e.target.src = FOOD_IMG; }}
          />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24">
            {isAvailable ? (
              <button
                onClick={handleAdd}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 text-xs font-extrabold uppercase tracking-widest text-orange-600 shadow-md transition hover:border-orange-200 hover:text-orange-700"
              >
                Add
              </button>
            ) : (
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [shop, setShop] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const cartCount = useSelector(s => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/shops/${id}`);
      if (data.success && data.shop) {
        setShop(data.shop);
        setMenuItems(data.shop.menu || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!shop) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: shop.name,
          text: 'Check out this restaurant on Orange Bite',
          url: window.location.href
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        dispatch(showToast({ message: 'Link copied to clipboard', type: 'success' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavorite = () => {
    dispatch(showToast({ message: 'Saved for later', type: 'success' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-semibold text-slate-500">Restaurant not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-full bg-orange-500 px-6 py-2 text-sm font-bold uppercase tracking-wide text-white"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const normalizedCategories = Array.from(
    new Set(menuItems.map(item => item.category || 'Other'))
  );
  const categories = ['All', ...normalizedCategories];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = menuItems.filter(item => {
    const category = item.category || 'Other';
    const isVeg = item.isVeg ?? item.is_veg ?? true;
    const matchesCategory = activeCategory === 'All' || category === activeCategory;
    const matchesVeg = !vegOnly || isVeg;
    const matchesSearch = !normalizedSearch
      || item.name?.toLowerCase().includes(normalizedSearch)
      || item.description?.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesVeg && matchesSearch;
  });

  const bannerImage = shop.images?.[0] || shop.image || FOOD_IMG;
  const isOpen = shop.is_open ?? shop.isOpen ?? true;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-dark)' }}>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/60 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleFavorite} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
              <Heart size={18} />
            </button>
            <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Restaurant</p>
                <h1 className="mt-2 text-3xl font-black text-slate-900">{shop.name}</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">{shop.description || 'Multi-cuisine favorites crafted daily.'}</p>
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <MapPin size={14} className="text-orange-500" />
                  <span>{shop.address?.street || shop.street}, {shop.address?.city || shop.city}</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${isOpen ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'}`} />
                  {isOpen ? 'Open now' : 'Closed'}
                </div>
              </div>
            </div>

            {!isOpen && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                <Info size={16} />
                This restaurant is currently closed. You can still browse the menu.
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                <Clock size={16} className="text-slate-500" />
                25-30 mins
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                <span>₹400 for two</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img
              src={bannerImage}
              alt={shop.name}
              className="h-full w-full object-cover"
              onError={e => { e.target.src = FOOD_IMG; }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <button onClick={handleFavorite} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm">
                <Heart size={18} />
              </button>
              <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Menu</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Browse dishes</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
                <Search size={16} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search dishes"
                  className="w-44 bg-transparent text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setVegOnly(value => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-widest ${vegOnly ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-500'}`}
              >
                <span className={`h-2 w-2 rounded-full ${vegOnly ? 'bg-orange-500' : 'bg-slate-300'}`} />
                Veg only
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-widest transition-all ${
                  activeCategory === category
                    ? 'bg-[#1E3A5F] text-white shadow-md'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4">
            {filtered.map(item => (
              <MenuItemCard key={item.id || item._id} item={item} shopId={shop.id || shop._id} shopName={shop.name} />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm font-bold text-slate-500">No items match your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-slate-900">{cartCount} item{cartCount > 1 ? 's' : ''} in cart</p>
              <p className="text-xs font-semibold text-slate-500">Ready to checkout</p>
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
            >
              View cart <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
