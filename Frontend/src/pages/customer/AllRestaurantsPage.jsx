import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { Search, ArrowLeft, Store, X, SlidersHorizontal } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '',          emoji: '🍽️', label: 'All' },
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

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div className="skeleton" style={{ height: '190px' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeleton" style={{ height: '18px', width: '70%', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '13px', width: '50%', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '13px', width: '60%', borderRadius: '6px' }} />
      </div>
    </div>
  );
}

// ─── Shop Card ────────────────────────────────────────────────────────────────

function ShopCard({ shop, index }) {
  const [hovered, setHovered] = useState(false);
  const img = shop.images?.[0] || FOOD_IMAGES[index % FOOD_IMAGES.length];
  const deliveryTime = 20 + ((index * 7) % 25);

  return (
    <Link
      to={`/restaurant/${shop._id || shop.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: `1.5px solid ${hovered ? '#FF7A00' : 'var(--border)'}`,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: hovered ? '0 10px 32px rgba(255,122,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        {/* Image */}
        <div style={{ position: 'relative', height: '190px', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={img}
            alt={shop.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.4s ease',
            }}
            onError={e => { e.target.src = FOOD_IMAGES[index % FOOD_IMAGES.length]; }}
          />
          {/* Open badge */}
          <span style={{
            position: 'absolute', top: '12px', left: '12px',
            background: '#16A34A', color: '#fff',
            fontSize: '10px', fontWeight: 800, padding: '4px 10px',
            borderRadius: '100px', letterSpacing: '0.04em',
          }}>🟢 OPEN</span>
          {/* Category badge */}
          {shop.category && (
            <span style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              color: '#fff', fontSize: '10px', fontWeight: 700,
              padding: '4px 10px', borderRadius: '100px',
            }}>{shop.category}</span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <h3 style={{
            margin: 0, fontSize: '15px', fontWeight: 800,
            color: 'var(--text-primary)', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{shop.name}</h3>

          {shop.description && (
            <p style={{
              margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{shop.description}</p>
          )}

          {/* Delivery info row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginTop: '4px', paddingTop: '10px',
            borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
              🕐 {deliveryTime}–{deliveryTime + 10} min
            </span>
            <span style={{ fontSize: '12px', color: 'var(--border)' }}>·</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
              🛵 ₹30 delivery
            </span>
            <span style={{
              marginLeft: 'auto', fontSize: '12px', fontWeight: 800,
              color: '#FF7A00',
            }}>Order →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── All Restaurants Page ─────────────────────────────────────────────────────

export default function AllRestaurantsPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/shops');
      if (data.success) {
        // Only show open + approved shops
        const open = (data.shops || []).filter(s =>
          s.isOpen === true && (s.isApproved === true || s.is_approved === true)
        );
        setShops(open);
      }
    } catch (e) {
      console.error('Failed to fetch shops', e);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter
  const filtered = shops.filter(s => {
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || s.category === category;
    return matchSearch && matchCat;
  });

  const hasFilters = search || category;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* ── Hero bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FF7A00 0%, #FF9F43 100%)',
        padding: '28px 24px 32px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Back button + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.25)', border: '1.5px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', transition: 'all 0.2s ease', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                All Restaurants
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                {loading ? 'Loading...' : `${shops.length} restaurant${shops.length !== 1 ? 's' : ''} currently open`}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={17}
              color="rgba(0,0,0,0.4)"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search restaurants or cuisines…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '13px 44px 13px 46px',
                borderRadius: '14px', border: 'none', outline: 'none',
                fontSize: '14px', fontWeight: 500, color: '#1A1A1A',
                background: '#fff', boxSizing: 'border-box',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                fontFamily: 'inherit',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: '#F3F4F6', border: 'none', borderRadius: '50%',
                  width: '26px', height: '26px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6B7280',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 100px' }}>

        {/* ── Cuisine filter chips ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex', gap: '8px', overflowX: 'auto',
            paddingBottom: '6px', scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map(cat => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id || 'all'}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '100px', flexShrink: 0,
                    background: active ? '#FF7A00' : '#fff',
                    border: `1.5px solid ${active ? '#FF7A00' : '#E5E7EB'}`,
                    color: active ? '#fff' : '#6B7280',
                    fontWeight: active ? 800 : 600, fontSize: '13px',
                    cursor: 'pointer', transition: 'all 0.18s ease',
                    fontFamily: 'inherit',
                    boxShadow: active ? '0 4px 12px rgba(255,122,0,0.3)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#FF7A00'; e.currentTarget.style.color = '#FF7A00'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; } }}
                >
                  <span style={{ fontSize: '15px' }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#374151' }}>
            {hasFilters
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`
              : `${filtered.length} open restaurant${filtered.length !== 1 ? 's' : ''}`
            }
          </p>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setCategory(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#FF7A00', fontWeight: 700, fontSize: '13px',
                fontFamily: 'inherit', padding: '4px 8px', borderRadius: '8px',
              }}
            >
              <X size={13} /> Clear filters
            </button>
          )}
        </div>

        {/* ── Grid / states ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: '24px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🍽️</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
              {hasFilters ? 'No restaurants match your filter' : 'No open restaurants right now'}
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
              {hasFilters ? 'Try a different search or cuisine filter.' : 'Check back later — restaurants open up throughout the day.'}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setCategory(''); }}
                style={{
                  padding: '12px 28px', borderRadius: '100px', border: 'none',
                  background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
                  color: '#fff', fontWeight: 800, fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(255,122,0,0.3)',
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {filtered.map((shop, i) => (
              <ShopCard key={shop._id || shop.id} shop={shop} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
