import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  UtensilsCrossed, LayoutDashboard, Users, Store,
  LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck
} from 'lucide-react';
import { selectUser } from '../features/auth/authSlice';
import { signOut } from '../features/auth/authSlice';

// No Profile item for admin
const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/shops', icon: Store, label: 'Shops' },
];

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/shops': 'Shop Management',
};

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { dispatch(signOut()); navigate('/login'); };

  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin Panel';

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      {/*
        Uses `fixed h-screen` so it never scrolls — logout stays pinned at bottom.
        The main content gets a left margin to compensate.
      */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-30
          ${collapsed ? 'w-16' : 'w-60'}
          bg-white border-r border-gray-100 shadow-sm
          flex flex-col
          transition-all duration-300
        `}
      >
        {/* ── Logo row + collapse toggle in top-left ── */}
        <div className="h-16 flex items-center border-b border-gray-100 flex-shrink-0">

          {/* Collapse / expand button — always top-left */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-16 h-full flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <PanelLeftOpen className="w-5 h-5" />
              : <PanelLeftClose className="w-5 h-5" />
            }
          </button>

          {/* Brand name — only when expanded */}
          {!collapsed && (
            <div className="pr-4 -ml-1">
              <span className="font-black text-orange-500 text-base block leading-none">OrangeBite</span>
              <span className="text-xs text-gray-400">Admin Panel</span>
            </div>
          )}
        </div>

        {/* ── Nav links — scrollable if many items ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active =
              location.pathname === to ||
              (to !== '/admin' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`
                  flex items-center ${collapsed ? 'justify-center' : 'gap-3'}
                  px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${active
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* ── Admin badge + Logout — fixed at bottom, never scrolls ── */}
        <div className="flex-shrink-0 border-t border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
          )}

          <div className={`${collapsed ? 'p-2' : 'px-4 pb-4'}`}>
            <button
              onClick={handleLogout}
              title="Logout"
              className={`
                ${collapsed ? 'w-full justify-center' : 'w-full'}
                flex items-center gap-2 text-sm text-red-500
                hover:text-red-600 hover:bg-red-50
                py-2 px-2 rounded-xl transition-colors font-medium
              `}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main — offset by sidebar width ── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          ${collapsed ? 'ml-16' : 'ml-60'}
          transition-all duration-300
        `}
      >
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{pageTitle}</h1>
            <p className="text-xs text-gray-400">OrangeBite Administration</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
