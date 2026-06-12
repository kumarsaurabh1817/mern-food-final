import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

const ROLE_COLORS = { user: 'bg-blue-50 text-blue-600', owner: 'bg-purple-50 text-purple-600', delivery_boy: 'bg-orange-50 text-orange-600', admin: 'bg-red-50 text-red-600' };

const FILTER_ROLES = ['all', 'user', 'owner', 'delivery_boy', 'admin'];

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioning, setActioning] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (committedSearch) params.set('search', committedSearch);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || data || []);
      setTotalPages(data.totalPages || 1);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, page, committedSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setCommittedSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setCommittedSearch('');
    setPage(1);
  };

  const action = async (userId, endpoint, successMsg) => {
    setActioning(userId + endpoint);
    try {
      await api.patch(endpoint);
      dispatch(showToast({ message: successMsg, type: 'success' }));
      fetchUsers();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Action failed', type: 'error' }));
    } finally {
      setActioning(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">User Management</h1>
        <p className="text-gray-400 text-sm mt-1">Manage KYC approvals and user accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            )}
          </div>
          <button type="submit" className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600">Search</button>
        </form>
        <div className="flex gap-1">
          {FILTER_ROLES.map((r) => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${roleFilter === r ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {r === 'delivery_boy' ? 'Delivery' : r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-white" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role === 'delivery_boy' ? 'Delivery' : user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex gap-1.5 flex-wrap">
                      {user.isBlocked && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Blocked</span>}
                      {user.isEmailVerified ? <span className="text-xs bg-green-50 text-green-500 px-2 py-0.5 rounded-full">Email ✓</span> : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Email ✗</span>}
                      {(user.role === 'owner' || user.role === 'delivery_boy') && (
                        user.isApprovedByAdmin ? <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">Approved</span> : <span className="text-xs bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full">Pending</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {(user.role === 'owner' || user.role === 'delivery_boy') && !user.isApprovedByAdmin && user.isEmailVerified && (
                        <>
                          <button
                            onClick={() => action(user._id, `/admin/users/${user._id}/approve`, 'User approved!')}
                            disabled={actioning === user._id + `/admin/users/${user._id}/approve`}
                            className="flex items-center gap-1 p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                            title="Approve KYC"
                          >
                            {actioning === user._id + `/admin/users/${user._id}/approve`
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => action(user._id, `/admin/users/${user._id}/reject`, 'User rejected')}
                            disabled={actioning === user._id + `/admin/users/${user._id}/reject`}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
                            title="Reject KYC"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(user.role === 'owner' || user.role === 'delivery_boy') && user.isApprovedByAdmin && (
                        <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-semibold">Approved</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
