import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../features/auth/authSlice';
import { selectCartCount } from '../features/cart/cartSlice';
import { Home, ShoppingBag, User, LogOut, ShoppingCart, Zap } from 'lucide-react';

export default function CustomerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const cartCount = useSelector(selectCartCount);

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ─── Top Navbar ─── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px var(--primary-glow)',
              }}>
                <Zap size={20} color="var(--bg-dark)" fill="var(--bg-dark)" />
              </div>
              <span className="text-gradient-orange" style={{
                fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em',
              }}>
                Orange Bite
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden-mobile">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 16px', borderRadius: '12px',
                    textDecoration: 'none', position: 'relative',
                    background: isActive(item.to) ? 'var(--primary-glow)' : 'transparent',
                    color: isActive(item.to) ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700, fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ position: 'relative', display: 'inline-flex' }}>
                    <item.icon size={17} />
                    {item.to === '/cart' && cartCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          right: '-2px',
                          bottom: '-2px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          border: '2px solid var(--bg-card)',
                        }}
                        className="animate-pulse-green"
                      />
                    )}
                  </span>
                  {item.label}
                  {item.badge > 0 && (
                    <span style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '18px', height: '18px',
                      background: 'var(--primary)', color: '#FFFFFF',
                      fontSize: '10px', fontWeight: 800,
                      borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                      className={cartCount > 0 ? 'animate-pulse-green' : ''}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px',
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: '10px', cursor: 'pointer',
                  color: 'var(--text-muted)', transition: 'all 0.2s ease',
                }}
                title="Sign Out"
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--error)'; e.currentTarget.style.color = 'var(--error)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <LogOut size={15} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main style={{ width: '100%', paddingBottom: '80px' }}>
        <Outlet />
      </main>

      {/* ─── Mobile Cart FAB ─── */}
      {cartCount > 0 && (
      <Link
          to="/cart"
          className="cart-fab"
          style={{
            position: 'fixed',
            zIndex: 60,
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(255,122,0,0.45)',
            transition: 'all 0.2s ease',
          }}
          aria-label="Open cart"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,122,0,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,122,0,0.45)'; }}
        >
          <ShoppingCart size={22} />
          <span
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '22px',
              height: '22px',
              borderRadius: '8px',
              background: '#fff',
              border: '2px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {cartCount}
          </span>
        </Link>
      )}

      {/* ─── Mobile Bottom Nav ─── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
      }} className="mobile-bottom-nav">
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '64px' }}>
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '4px', flex: 1, height: '100%', justifyContent: 'center',
                textDecoration: 'none', position: 'relative',
                color: isActive(item.to) ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              <item.icon size={22} />
              <span style={{ fontSize: '10px', fontWeight: 700 }}>{item.label}</span>
              {isActive(item.to) && (
                <span style={{
                  position: 'absolute', bottom: '6px',
                  width: '4px', height: '4px',
                  background: 'var(--primary)', borderRadius: '50%',
                }} />
              )}
              {item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: '8px', right: 'calc(50% - 18px)',
                  width: '16px', height: '16px',
                  background: 'var(--primary)', color: '#FFFFFF',
                  fontSize: '9px', fontWeight: 800,
                  borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', flex: 1, height: '100%', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <LogOut size={22} />
            <span style={{ fontSize: '10px', fontWeight: 700 }}>Logout</span>
          </button>
        </div>
      </nav>

      <style>{`
        @media (min-width: 640px) {
          .hidden-mobile { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
          .cart-fab {
            bottom: 32px !important;
            right: 32px !important;
          }
        }
        @media (max-width: 639px) {
          .hidden-mobile { display: none !important; }
          .mobile-bottom-nav { display: block !important; }
          .cart-fab {
            bottom: calc(64px + 24px) !important;
            right: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
