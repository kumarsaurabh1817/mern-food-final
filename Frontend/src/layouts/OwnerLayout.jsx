import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../features/auth/authSlice';
import { showToast } from '../features/ui/uiSlice';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed,
  Settings, LogOut, Zap, X, Power, UserCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../lib/axios';

const NAV_ITEMS = [
  { to: '/owner',            icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/owner/orders',     icon: ClipboardList,   label: 'Orders'        },
  { to: '/owner/menu',       icon: UtensilsCrossed, label: 'Menu'          },
  { to: '/owner/shop',       icon: Settings,        label: 'Shop Settings' },
  { to: '/owner/profile',    icon: UserCircle,      label: 'My Profile'    },
];

/* ── Sidebar (standalone so it renders identically desktop + mobile) ─── */
function Sidebar({ onClose, shopLive, onToggleShop, profile, isActive, handleSignOut }) {
  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      background: '#1E3A5F',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to="/owner"
            onClick={onClose}
            aria-label="Go to owner dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          >
            <div style={{
              width: '34px', height: '34px',
              background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255,122,0,0.4)',
            }}>
              <Zap size={17} color="#fff" fill="#fff" />
            </div>
            <span style={{
              fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Orange Bite
            </span>
          </Link>
          {onClose && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          )}
        </div>
        <span style={{
          marginTop: '8px', display: 'inline-block',
          background: 'rgba(255,122,0,0.15)', color: '#FF9F43',
          border: '1px solid rgba(255,122,0,0.3)',
          borderRadius: '100px', padding: '2px 10px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>Owner Panel</span>
      </div>

      {/* Profile */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #FF7A00, #FF9F43)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 900, color: '#fff',
            flexShrink: 0,
          }}>
            {profile?.name?.[0]?.toUpperCase() || 'O'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '13px', fontWeight: 700, color: '#fff',
              margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {profile?.name || 'Restaurant Owner'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <div style={{
                width: '7px', height: '7px',
                background: shopLive ? '#22C55E' : '#EF4444',
                borderRadius: '50%',
              }} />
              <span style={{ fontSize: '11px', color: shopLive ? '#86EFAC' : '#FCA5A5', fontWeight: 600 }}>
                {shopLive ? 'Online' : 'Closed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px',
                textDecoration: 'none',
                borderRadius: '10px',
                background: active ? 'linear-gradient(135deg, #FF7A00, #FF9F43)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: active ? 700 : 500,
                fontSize: '13px',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 4px 12px rgba(255,122,0,0.35)' : 'none',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }
              }}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — toggle + sign out */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Shop Live Toggle */}
        <button
          onClick={onToggleShop}
          style={{
            width: '100%', padding: '10px 14px',
            borderRadius: '12px', border: '1px solid',
            borderColor: shopLive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: shopLive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
            transition: 'all 0.3s ease',
            fontFamily: 'inherit',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Power size={14} color={shopLive ? '#22C55E' : '#EF4444'} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: shopLive ? '#86EFAC' : '#FCA5A5' }}>
              {shopLive ? 'Shop is Live' : 'Shop is Closed'}
            </span>
          </div>
          {/* Toggle pill */}
          <div style={{
            width: '36px', height: '18px',
            background: shopLive ? '#22C55E' : 'rgba(255,255,255,0.2)',
            borderRadius: '100px', position: 'relative',
            transition: 'background 0.3s ease',
          }}>
            <div style={{
              position: 'absolute',
              top: '3px',
              left: shopLive ? '19px' : '3px',
              width: '12px', height: '12px',
              background: '#fff', borderRadius: '50%',
              transition: 'left 0.3s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </div>
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '9px 14px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600,
            transition: 'all 0.2s ease', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function OwnerLayout() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user: profile } = useSelector(s => s.auth);
  const [shop, setShop] = useState(null);
  const shopLive = !!shop?.isOpen;

  const fetchShop = async () => {
    try {
      const { data } = await api.get('/shops/owner/me');
      if (data?.success) {
        setShop(data.shop || null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigate('/login');
  };

  const isActive = (to) => {
    const [path, hash] = to.split('#');
    if (hash) return location.pathname === path && location.hash === `#${hash}`;
    if (path === '/owner') return location.pathname === '/owner' && !location.hash;
    return location.pathname.startsWith(path);
  };

  const handleToggleShop = async () => {
    if (!shop) return;
    try {
      const { data } = await api.patch(`/shops/${shop._id || shop.id}/toggle-open`);
      if (data?.success) {
        setShop(prev => (prev ? { ...prev, isOpen: data.isOpen } : prev));
        dispatch(showToast({ message: data.isOpen ? 'Shop opened' : 'Shop closed', type: 'success' }));
      }
    } catch (error) {
      dispatch(showToast({
        message: error.response?.data?.message || 'Unable to update shop status',
        type: 'error'
      }));
    }
  };

  const sidebarProps = {
    shopLive,
    onToggleShop: handleToggleShop,
    profile,
    isActive,
    handleSignOut,
  };

  return (
    <div className="owner-theme owner-shell">

      {/* Desktop Sidebar */}
      <div className="owner-sidebar-desktop">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Main Content */}
      <div className="owner-main">
        <main className="owner-main-content">
          <Outlet context={{ shop, setShop, refreshShop: fetchShop }} />
        </main>
      </div>

      <style>{`
        .owner-sidebar-desktop { display: flex; }
      `}</style>
    </div>
  );
}
