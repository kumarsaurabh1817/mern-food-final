import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/axios';
import { Search, Navigation, Loader2, X, MapPin } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'Indian',    emoji: '🍛', label: 'Indian' },
  { id: 'Chinese',   emoji: '🍜', label: 'Chinese' },
  { id: 'Fast Food', emoji: '🍔', label: 'Fast Food' },
  { id: 'Pizza',     emoji: '🍕', label: 'Pizza' },
  { id: 'Biryani',   emoji: '🍲', label: 'Biryani' },
  { id: 'Desserts',  emoji: '🍰', label: 'Desserts' },
  { id: 'Beverages', emoji: '☕', label: 'Beverages' },
  { id: 'Other',     emoji: '🍽️', label: 'Other' },
];

const FOOD_IMAGES = [
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg?auto=compress&cs=tinysrgb&w=800',
];

// ─── Greeting Helper ─────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div className="skeleton" style={{ height: '180px' }} />
      <div style={{ padding: '16px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeleton" style={{ height: '18px', width: '70%' }} />
        <div className="skeleton" style={{ height: '13px', width: '50%' }} />
        <div className="skeleton" style={{ height: '13px', width: '60%' }} />
      </div>
    </div>
  );
}

// ─── ShopCard ─────────────────────────────────────────────────────────────────

function ShopCard({ shop, index }) {
  const [hovered, setHovered] = useState(false);
  const img = shop.images?.[0] || FOOD_IMAGES[index % FOOD_IMAGES.length];

  // Derive stable display values from the shop's _id so they never flicker on
  // re-render (previously Math.random() was called on every render/hover).
  const idSum = (shop._id || shop.id || '')
    .split('').reduce((acc, c) => acc + c.charCodeAt(0), index);
  const deliveryTime = 20 + (idSum % 20);          // 20–39 min, stable
  const priceForTwo  = 200 + ((idSum * 7) % 300);  // ₹200–499, stable

  const isPromoted = index === 0 || index === 2;

  return (
    <Link
      to={`/restaurant/${shop._id || shop.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: hovered ? '0 8px 28px rgba(255,122,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
          transition: 'all 0.25s ease',
          animationDelay: `${index * 0.05}s`,
          display: 'flex', flexDirection: 'column', height: '100%',
        }}
        className={`${isPromoted ? 'glow-border' : ''} animate-slide-up`}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '185px', overflow: 'hidden' }}>
          <img
            src={img}
            alt={shop.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.4s ease',
            }}
            onError={e => { e.target.src = FOOD_IMAGES[0]; }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)',
          }} />

          {/* Delivery time - bottom left */}
          <div style={{
            position: 'absolute', bottom: '12px', left: '12px',
            background: 'var(--primary)', color: 'var(--bg-dark)',
            padding: '3px 10px', borderRadius: '100px',
            fontSize: '11px', fontWeight: 800,
          }}>
            {deliveryTime} min
          </div>

          {/* Promoted badge */}
          {isPromoted && (
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              background: 'var(--accent)', color: 'var(--text-primary)',
              padding: '3px 9px', borderRadius: '100px',
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              Promoted
            </div>
          )}

          {/* Closed overlay */}
          {!shop.isOpen && !shop.is_open && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                background: 'var(--bg-card)', color: 'var(--text-muted)',
                padding: '8px 16px', borderRadius: '10px',
                fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em',
                textTransform: 'uppercase', border: '1px solid var(--border)',
              }}>
                Currently Closed
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)',
            margin: '0 0 4px', letterSpacing: '-0.02em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {shop.name}
          </h3>
          <p style={{
            fontSize: '12px', color: 'var(--text-muted)',
            margin: '0 0 8px', fontWeight: 500,
          }}>
            {shop.description || shop.category || 'Multi-cuisine restaurant'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              ₹{priceForTwo} for two
            </span>
            <span style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: 'var(--primary)', display: 'inline-block',
            }} />
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Free delivery</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user: profile } = useSelector(s => s.auth);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('Detecting...');
  const [locLoading, setLocLoading] = useState(false);


  const fetchLocation = () => {
    if (!navigator.geolocation) { setCity('Location N/A'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const json = await res.json();
          const addr = json.address;
          setCity(addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.county || 'Near You');
        } catch { setCity('Near You'); }
        finally { setLocLoading(false); }
      },
      () => { setCity('Mumbai'); setLocLoading(false); },
      { timeout: 8000 }
    );
  };


  useEffect(() => {
    fetchLocation();
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/shops');
        setShops(data.shops || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const filtered = shops.filter(s => {
    const term = search.toLowerCase();
    const matchSearch = !search
      || (s.name || '').toLowerCase().includes(term)
      || (s.category || '').toLowerCase().includes(term)
      || (s.description || '').toLowerCase().includes(term);
    const matchCat = !category
      || (s.category || '').toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });


  const greeting = getGreeting();
  const firstName = profile?.name?.split(' ')[0] || 'User';

  return (
    <div style={{
      background: 'var(--bg-dark)',
      minHeight: '100vh',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div className="max-w-7xl mx-auto px-4">

        {/* ── SECTION 1: Hero Search ─────────────────────────────────────────── */}
        <div style={{ padding: '40px 0 32px' }} className="animate-slide-up">

          {/* Greeting */}
          <p style={{
            fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', margin: '0 0 6px',
          }}>
            {greeting}, {firstName} 👋
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '0 0 28px', fontWeight: 500 }}>
            What are you craving today?
          </p>

          {/* ── Location chip ── */}
          <button
            onClick={fetchLocation}
            title="Detect my location"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '100px', marginBottom: '14px',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {locLoading
              ? <Loader2 size={13} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
              : <MapPin size={13} color="var(--primary)" />}
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {city}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>· Tap to update</span>
          </button>

          {/* ── Search Bar (flat, like AllRestaurantsPage) ── */}
          <div style={{ position: 'relative' }}>
            <Search
              size={17}
              color="rgba(0,0,0,0.38)"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search restaurants or cuisines…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '13px 48px 13px 46px',
                borderRadius: '14px', border: '1.5px solid var(--border)',
                outline: 'none', fontSize: '14px', fontWeight: 500,
                color: 'var(--text-primary)', background: 'var(--bg-surface)',
                boxSizing: 'border-box', fontFamily: 'inherit',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: '#F3F4F6', border: 'none', borderRadius: '50%',
                  width: '26px', height: '26px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280',
                }}
              >
                <X size={13} />
              </button>
            ) : (
              <Search size={16} color="var(--primary)"
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            )}
          </div>
        </div>

        {/* ── SECTION 2: Category Chips ─────────────────────────────────────── */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Browse by cuisine
          </h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }} className="scrollbar-hide">
            {/* All button */}
            {[{ id: '', emoji: '🍽️', label: 'All' }, ...CATEGORIES].map((cat, i) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id || 'all'}
                  onClick={() => setCategory(cat.id)}
                  className="animate-slide-up"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 18px', borderRadius: '100px', flexShrink: 0,
                    background: active ? 'var(--primary)' : 'var(--bg-card)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    color: active ? '#fff' : 'var(--text-muted)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                >
                  <span style={{ fontSize: '16px' }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: Featured Restaurants ──────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              {search || category ? `🔍 Results${filtered.length > 0 ? ` (${filtered.length})` : ''}` : 'Restaurants Available'}
            </h2>
            {(search || category) && (
              <button
                onClick={() => { setSearch(''); setCategory(''); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', fontFamily: 'inherit' }}
              >
                Clear ✕
              </button>
            )}
            {!search && !category && (
              <Link
                to="/restaurants"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '8px 16px', borderRadius: '100px',
                  background: 'var(--primary-glow)',
                  border: '1px solid rgba(255,122,0,0.25)',
                  color: 'var(--primary)', fontWeight: 700, fontSize: '13px',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-glow)'; }}
              >
                View All →
              </Link>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }} className="md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>No restaurants found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Try a different search or cuisine</p>
              <button onClick={() => { setSearch(''); setCategory(''); }} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((shop, i) => (
                <ShopCard key={shop._id || shop.id} shop={shop} index={i} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
