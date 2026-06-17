import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Clock, MapPin, Plus, Minus, ShoppingCart, ChevronLeft } from 'lucide-react';
import api from '../../lib/axios';
import { addItemSafe, removeItem, selectCartItems } from '../../features/cart/cartSlice';

// ─── Isolated menu item row ────────────────────────────────────────────────────
// memo() prevents re-rendering siblings when only one item's quantity changes.
// qty + callbacks are passed as primitives/stable refs so React can bail out.
const MenuItemRow = memo(function MenuItemRow({ item, qty, onAdd, onRemove }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start shadow-sm transition-opacity ${
        !item.isAvailable ? 'opacity-50' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`w-4 h-4 border-2 rounded-sm flex-shrink-0 flex items-center justify-center ${
              item.isVeg ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
          </span>
          <h3 className="font-semibold text-gray-900 text-base truncate">{item.name}</h3>
          {!item.isAvailable && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-gray-400 text-xs mb-2 line-clamp-2">{item.description}</p>
        )}
        <p className="text-orange-500 font-bold">₹{item.price}</p>
      </div>

      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-20 h-20 object-cover rounded-xl"
          />
        )}
        {item.isAvailable && (
          qty > 0 ? (
            <div className="flex items-center gap-2 bg-orange-500 rounded-xl px-2 py-1">
              <button
                onClick={() => onRemove(item._id)}
                className="text-white active:scale-90 transition-transform"
                aria-label="Remove one"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white font-bold text-sm w-5 text-center">{qty}</span>
              <button
                onClick={() => onAdd(item)}
                className="text-white active:scale-90 transition-transform"
                aria-label="Add one more"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item)}
              className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )
        )}
      </div>
    </div>
  );
});

// ─── Cart qty selector — reads only this item's qty from a pre-built map ───────
// Passed as a plain number; component only re-renders when ITS quantity changes.
function useCartQtyMap() {
  const cartItems = useSelector(selectCartItems);
  return useMemo(
    () => Object.fromEntries(cartItems.map((i) => [i._id, i.quantity])),
    [cartItems]
  );
}

// ─── Floating cart bar — isolated so it doesn't re-render the whole page ──────
const CartBar = memo(function CartBar({ onClick }) {
  const cartItems = useSelector(selectCartItems);
  if (cartItems.length === 0) return null;
  const total = cartItems.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={onClick}
        className="flex items-center gap-3 bg-orange-500 text-white px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-300 font-semibold hover:bg-orange-600 active:scale-95 transition-all"
      >
        <ShoppingCart className="w-5 h-5" />
        View cart ({total} item{total !== 1 ? 's' : ''})
      </button>
    </div>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RestaurantPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const qtyMap = useCartQtyMap();

  const [shop, setShop] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    api
      .get(`/shops/${id}`)
      .then(({ data }) => {
        const shopData = data.shop || data;
        setShop(shopData);
        setMenuItems(shopData.menu || []);
      })
      .catch(() => navigate('/restaurants'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Derived lists — only recomputed when menuItems / activeCategory changes
  const categories = useMemo(
    () => ['All', ...new Set(menuItems.map((i) => i.category).filter(Boolean))],
    [menuItems]
  );

  const filtered = useMemo(
    () =>
      (activeCategory === 'All' ? menuItems : menuItems.filter((i) => i.category === activeCategory))
        .filter((item) => !item.isDeleted),
    [menuItems, activeCategory]
  );

  // Stable callbacks — won't cause child re-renders on parent state changes
  const handleAdd = useCallback(
    (item) => {
      dispatch(addItemSafe({ item, shopId: id, shopName: shop?.name }));
    },
    [dispatch, id, shop?.name]
  );

  const handleRemove = useCallback(
    (itemId) => {
      dispatch(removeItem(itemId));
    },
    [dispatch]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-56 bg-gray-100 rounded-2xl mb-6" />
        <div className="h-6 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Shop header */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 shadow-sm">
        <div className="relative h-52 overflow-hidden">
          <img
            src={
              shop.images?.[0] ||
              'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800'
            }
            alt={shop.name}
            loading="eager"
            className="w-full h-full object-cover"
          />
          {!shop.isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 font-bold px-5 py-2 rounded-full text-lg">
                Currently Closed
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">{shop.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{shop.category}</p>
              {shop.description && (
                <p className="text-gray-400 text-sm mt-2 max-w-lg">{shop.description}</p>
              )}
            </div>
            <span
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold ${
                shop.isOpen ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {shop.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.2 (200+ ratings)
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {shop.operatingHours?.open} – {shop.operatingHours?.close}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {shop.address?.city}
            </span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Menu items — each row is isolated via memo */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <MenuItemRow
            key={item._id}
            item={item}
            qty={qtyMap[item._id] || 0}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No items in this category</div>
        )}
      </div>

      {/* Floating cart button — isolated component so it doesn't re-render menu */}
      <CartBar onClick={() => navigate('/cart')} />
    </div>
  );
}
