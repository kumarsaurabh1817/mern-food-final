import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../features/auth/authSlice';
import { LayoutDashboard, Users, Store, LogOut, Zap, Menu, UserCircle } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/admin',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',  icon: Users,           label: 'Users'     },
  { to: '/admin/shops',  icon: Store,           label: 'Shops'     },
  { to: '/admin/profile',icon: UserCircle,      label: 'My Profile'},
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: profile } = useSelector(s => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#1E3A5F] flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: '#FF7A00' }}>Orange Bite</span>
          </div>
          <p className="text-xs text-white/50 mt-1.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? 'bg-orange-500 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/admin/profile"
            className="flex items-center gap-3 mb-3 group hover:opacity-80 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{profile?.name}</p>
              <p className="text-xs text-white/50">Administrator · Edit Profile</p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 lg:ml-60">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-500">
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">
            {navItems.find(n => n.to === location.pathname)?.label || 'Admin'}
          </h1>
          <div />
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
