import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Store, ShoppingBag, DollarSign, Clock, BarChart2, AlertCircle, ArrowUpRight } from 'lucide-react';
import api from '../../lib/axios';
import { getSocket } from '../../lib/socket';
import LiveDot from '../../components/ui/LiveDot';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  const fetchDashboard = () => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/revenue'),
    ]).then(([kpiRes, revRes]) => {
      // Backend returns { success, data: { gmv, totalOrders, activeUsers, totalCommission, pendingApprovals, totalShops } }
      setKpis(kpiRes.data.data || kpiRes.data);
      setRevenue(revRes.data.data || revRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  // ── Real-time: refresh platform metrics on any order event (debounced) ──────
  useEffect(() => {
    const socket = getSocket();
    const join = () => socket.emit('joinAdminRoom');
    socket.on('connect', join);
    if (socket.connected) join();

    const refresh = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchDashboard, 800);
    };
    socket.on('order:new', refresh);
    socket.on('order:update', refresh);

    return () => {
      clearTimeout(debounceRef.current);
      socket.off('connect', join);
      socket.off('order:new', refresh);
      socket.off('order:update', refresh);
    };
  }, []);

  const kpiCards = kpis ? [
    {
      label: 'Total GMV',
      value: `₹${(kpis.gmv || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      label: 'Total Orders',
      value: (kpis.totalOrders || 0).toLocaleString('en-IN'),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Active Users',
      value: (kpis.activeUsers || 0).toLocaleString('en-IN'),
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      label: 'Total Shops',
      value: (kpis.totalShops || 0).toLocaleString('en-IN'),
      icon: Store,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      label: 'Commission Earned',
      value: `₹${(kpis.totalCommission || 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      border: 'border-cyan-100',
    },
    {
      label: 'Pending Approvals',
      value: kpis.pendingApprovals || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      alert: kpis.pendingApprovals > 0,
    },
  ] : [];

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900">Platform Overview</h1>
          <LiveDot />
        </div>
        <p className="text-gray-400 text-sm mt-1">Real-time metrics for OrangeBite</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, color, bg, border, alert }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl border ${alert ? 'border-amber-200' : 'border-gray-100'} p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              {alert && (
                <span className="text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                  Action needed
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown — only shown when there's data */}
      {revenue?.shopRevenueBreakdown && Object.keys(revenue.shopRevenueBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-orange-400" /> Revenue Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total GMV', value: `₹${(revenue.totalGmv || 0).toLocaleString('en-IN')}` },
              { label: 'Platform Commission', value: `₹${(revenue.totalCommission || 0).toLocaleString('en-IN')}` },
              { label: 'Shop Payouts', value: `₹${(revenue.totalPayoutToShops || 0).toLocaleString('en-IN')}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-lg font-black text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Manage Users</p>
              <p className="text-xs text-gray-400">Approve KYC, block accounts</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
        </Link>
        <Link
          to="/admin/shops"
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Manage Shops</p>
              <p className="text-xs text-gray-400">Approve restaurants, suspend shops</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
        </Link>
      </div>

      {/* Empty state */}
      {!kpis && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No dashboard data available</p>
        </div>
      )}
    </div>
  );
}
