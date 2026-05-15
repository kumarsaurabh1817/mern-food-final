import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import { CheckCircle, Ban, Search, User, Store, Truck, ShieldCheck, Filter } from 'lucide-react';

const ROLE_ICONS = { user: User, owner: Store, delivery_boy: Truck, admin: ShieldCheck };
const ROLE_COLORS = { user: 'bg-blue-100 text-blue-700', owner: 'bg-orange-100 text-orange-700', delivery_boy: 'bg-teal-100 text-teal-700', admin: 'bg-purple-100 text-purple-700' };

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users?limit=1000');
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id, name) => {
    setActionLoading(id + '_approve');
    try {
      const { data } = await api.patch(`/admin/users/${id}/approve`);
      if (data.success) {
        dispatch(showToast({ message: `${name} approved`, type: 'success' }));
        fetchUsers();
      }
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error approving user', type: 'error' }));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBlock = async (id, name, isBlocked) => {
    setActionLoading(id + '_block');
    try {
      const { data } = await api.patch(`/admin/users/${id}/block`);
      if (data.success) {
        dispatch(showToast({ message: `${name} ${isBlocked ? 'unblocked' : 'blocked'}`, type: 'success' }));
        fetchUsers();
      }
    } catch (error) {
      dispatch(showToast({ message: error.response?.data?.message || 'Error blocking user', type: 'error' }));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    const name = (u.name || '').toLowerCase();
    const id = (u._id || u.id || '').toString();
    const matchSearch = !search || name.includes(term) || id.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all"
            placeholder="Search by name or ID..." />
        </div>
        <div className="relative min-w-[200px]">
          <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 appearance-none focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all">
            <option value="all">All Roles</option>
            <option value="user">Customers</option>
            <option value="owner">Owners</option>
            <option value="delivery_boy">Delivery</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(user => {
                const RoleIcon = ROLE_ICONS[user.role] || User;
                return (
                  <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-sm font-black text-orange-600">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 tracking-tight">{user.name}</p>
                          <p className="text-xs font-semibold text-gray-400 mt-0.5">{user.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg font-bold ${ROLE_COLORS[user.role]}`}>
                        <RoleIcon size={12} />
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.isBlocked || user.is_blocked ? (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-lg w-fit">Blocked</span>
                        ) : user.isApprovedByAdmin || user.is_approved_by_admin ? (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-lg w-fit">Approved</span>
                        ) : user.role !== 'user' && user.role !== 'admin' ? (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg w-fit">Pending</span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg w-fit">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-400">
                      {new Date(user.createdAt || user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!(user.isApprovedByAdmin || user.is_approved_by_admin) && user.role !== 'user' && user.role !== 'admin' && !(user.isBlocked || user.is_blocked) && (
                          <button
                            onClick={() => approve(user._id || user.id, user.name)}
                            disabled={actionLoading === (user._id || user.id) + '_approve'}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => toggleBlock(user._id || user.id, user.name, user.isBlocked || user.is_blocked)}
                            disabled={actionLoading === (user._id || user.id) + '_block'}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                              user.isBlocked || user.is_blocked
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                                : 'bg-red-50 hover:bg-red-100 text-red-600'
                            }`}
                          >
                            <Ban size={14} /> {user.isBlocked || user.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-400 font-bold uppercase tracking-wider">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
