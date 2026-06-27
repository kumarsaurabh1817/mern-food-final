import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp, ShoppingBag, DollarSign, Star, BarChart2, Package } from 'lucide-react';
import api from '../../lib/axios';
import { getSocket } from '../../lib/socket';
import { selectUser } from '../../features/auth/authSlice';
import StatCard from '../../components/ui/StatCard';
import LiveDot from '../../components/ui/LiveDot';

const STATUS_COLORS = { pending: 'bg-amber-50 text-amber-600', confirmed: 'bg-blue-50 text-blue-600', preparing: 'bg-purple-50 text-purple-600', ready_for_pickup: 'bg-cyan-50 text-cyan-600', out_for_delivery: 'bg-orange-50 text-orange-600', delivered: 'bg-green-50 text-green-600', cancelled: 'bg-red-50 text-red-600' };

export default function OwnerDashboard() {
  const user = useSelector(selectUser);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  const fetchAnalytics = () => {
    api.get('/orders/analytics').then(({ data }) => {
      // API returns { analytics: { revenue, orders, topItems, statusCounts, ... } }
      setAnalytics(data.analytics || data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // ── Real-time: refresh KPIs when orders change (debounced to batch bursts) ──
  useEffect(() => {
    const socket = getSocket();
    const join = () => { if (user?.id) socket.emit('joinOwnerRoom', user.id); };
    socket.on('connect', join);
    if (socket.connected) join();

    const refresh = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchAnalytics, 600);
    };
    socket.on('order:new', refresh);
    socket.on('order:update', refresh);

    return () => {
      clearTimeout(debounceRef.current);
      socket.off('connect', join);
      socket.off('order:new', refresh);
      socket.off('order:update', refresh);
    };
  }, [user?.id]);

  const kpis = [
    { label: 'Total Revenue', value: `₹${(analytics?.revenue?.today + (analytics?.revenue?.yesterday || 0) || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: "Today's Orders", value: analytics?.orders?.today || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Orders', value: analytics?.orders?.pending || 0, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Top Item', value: analytics?.topItems?.[0]?.name || 'N/A', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
            <LiveDot />
          </div>
          <p className="text-gray-400 text-sm mt-1">Overview of your restaurant performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Orders by status */}
      {analytics?.statusCounts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-orange-400" /> Orders by Status</h3>
            <div className="space-y-3">
              {Object.entries(analytics.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-gray-50 text-gray-500'} capitalize`}>
                    {status.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 bg-orange-400 rounded-full"
                      style={{ width: `${(Object.values(analytics.statusCounts).reduce((a,b)=>a+b,0)) ? (count / Object.values(analytics.statusCounts).reduce((a,b)=>a+b,0)) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-600 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {analytics?.topItems && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Top Items</h3>
              <div className="space-y-3">
                {analytics.topItems.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-orange-50 text-orange-500 rounded-full text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count} sold</span>
                  </div>
                ))}
                {(!analytics.topItems || analytics.topItems.length === 0) && <p className="text-gray-400 text-sm text-center py-4">No data yet</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {!analytics && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <BarChart2 className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No analytics data available yet</p>
        </div>
      )}
    </div>
  );
}
