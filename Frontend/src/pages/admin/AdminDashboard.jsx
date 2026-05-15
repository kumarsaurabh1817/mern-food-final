import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { Users, Store, ArrowRight, Clock, Activity, ShoppingBag } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, shops: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [dashRes, usersRes, shopsRes, ordersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users?isApprovedByAdmin=false'),
        api.get('/admin/shops'),
        api.get('/orders?limit=5')
      ]);

      setStats({
        users: dashRes.data?.data?.activeUsers || 0,
        shops: shopsRes.data?.total || 0,
        orders: dashRes.data?.data?.totalOrders || 0,
        revenue: dashRes.data?.data?.totalCommission || 0,
        pending: usersRes.data?.total || 0,
      });

      setRecentOrders(ordersRes.data?.orders || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', link: '/admin/users' },
    { label: 'Restaurants', value: stats.shops, icon: Store, color: 'text-orange-500', bg: 'bg-orange-50', link: '/admin/shops' },
    { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', link: '/admin/users' },
  ];

  const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready_for_pickup: 'bg-violet-100 text-violet-700',
    out_for_delivery: 'bg-teal-100 text-teal-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-10 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          Platform Overview
        </h1>
        <p className="text-sm font-semibold text-gray-500 mt-1 uppercase tracking-widest">Welcome back, Admin</p>
      </div>

      {/* Revenue banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-[2rem] p-8 mb-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-90">
             <Activity size={18} />
             <p className="text-sm font-bold uppercase tracking-wider">Platform Revenue</p>
          </div>
          <p className="text-5xl font-black tracking-tight mb-2">₹{stats.revenue.toFixed(0)}</p>
          <p className="text-white/80 font-medium text-sm">Total commission from delivered orders</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute right-20 -top-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
      </div>

      {/* Stats grid — 3 equal columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {cards.map(card => (
          <Link key={card.label} to={card.link} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all group">
            <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon size={22} className={card.color} />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</p>
            <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Recent Orders</h3>
          <Link to="/admin/orders" className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 uppercase tracking-wider">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShoppingBag className="text-gray-300" size={24} />
            </div>
            <p className="text-gray-400 font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Restaurant</th>
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map(order => (
                  <tr key={order._id || order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-mono text-sm font-semibold text-gray-500">#{(order._id || order.id)?.slice(-6).toUpperCase()}</td>
                    <td className="py-4 font-bold text-gray-900">{order.shop?.name || order.shops?.name || '—'}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right font-black text-gray-900">₹{(order.totalAmount || order.total_amount || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
