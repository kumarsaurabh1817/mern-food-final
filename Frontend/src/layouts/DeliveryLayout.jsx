import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../features/auth/authSlice';
import { Zap, LogOut } from 'lucide-react';

export default function DeliveryLayout() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useSelector(s => s.auth);

  const handleSignOut = async () => { await dispatch(signOut()); navigate('/login'); };
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'DA';

  // The dashboard is a live-map view that must fill the viewport without scrolling.
  // Profile and any other sub-pages need normal document flow (scrollable).
  const isDashboard = location.pathname === '/delivery' || location.pathname === '/delivery/';
  const rootStyle = isDashboard
    ? { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#F4F6F9' }
    : { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#F4F6F9' };
  const mainStyle = isDashboard
    ? { flex: 1, overflow: 'hidden' }
    : { flex: 1, overflowY: 'auto' };

  return (
    <div style={rootStyle}>

      {/* Slim Navbar */}
      <header style={{ flexShrink: 0, height: 50, background: '#fff', borderBottom: '1px solid #EDEFF2', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 50 }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#FF7A00,#FF5200)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(255,122,0,0.35)' }}>
            <Zap size={13} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#FF7A00', letterSpacing: '-0.02em' }}>
            Orange <span style={{ color: '#1A1A1A' }}>Bite</span>
          </span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#FF7A00', padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Partner</span>
        </div>

        {/* Right side — profile link + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to="/delivery/profile"
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '4px 8px', borderRadius: 8, background: location.pathname.includes('/profile') ? 'rgba(255,122,0,0.1)' : 'transparent', transition: 'background 0.2s ease' }}
            title="My Profile"
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#FF7A00,#FF5200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>
              {initials}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: location.pathname.includes('/profile') ? '#FF7A00' : '#374151' }}>
              {user?.name?.split(' ')[0] || 'Agent'}
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#9CA3AF', padding: '4px' }}
            title="Sign out"
          >
            <LogOut size={13} color="#9CA3AF" />
          </button>
        </div>
      </header>

      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  );
}
