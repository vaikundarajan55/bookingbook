import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchUsers, toggleUserActive } from '../store/adminUserSlice.js';
import { formatDate } from '../../core/format.js';

export default function UsersManager() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.adminUsers);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { dispatch(fetchUsers({ search: debounced, role })); }, [dispatch, debounced, role]);

  const toggle = async (user) => {
    const result = await dispatch(toggleUserActive(user.id));
    if (toggleUserActive.fulfilled.match(result)) toast.success(`${user.name} ${result.payload.is_active ? 'can sign in again' : 'can no longer sign in'}`);
    else toast.error(result.payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold text-ocean">Users</h1><p className="mt-1 text-ink/60">{items.length} accounts</p></div>
        <div className="flex flex-wrap gap-3">
          <select className="field !w-40" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
            <option value="">All users</option><option value="guest">Guests</option><option value="admin">Admins</option>
          </select>
          <input className="field !w-72" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        </div>
      </div>
      {status === 'loading' && !items.length ? <div className="skeleton h-48" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-mist text-xs font-semibold text-ink/55"><tr><th className="px-6 py-3">Name</th><th className="px-3 py-3">Phone</th><th className="px-3 py-3">Bookings</th><th className="px-3 py-3">Joined</th><th className="px-6 py-3 text-right">Access</th></tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t border-ocean/5">
                  <td className="px-6 py-3"><p className="font-semibold text-ocean">{u.name} {u.role === 'admin' && <span className="ml-1 rounded-full bg-brass-100 px-2 py-0.5 text-xs text-brass-600">Admin</span>}</p><p className="text-xs text-ink/55">{u.email}</p></td>
                  <td className="px-3 py-3">{u.phone || '—'}</td><td className="px-3 py-3 font-semibold">{u.bookings_count}</td><td className="px-3 py-3">{formatDate(u.created_at)}</td>
                  <td className="px-6 py-3 text-right">
                    {u.role === 'admin' ? <span className="text-xs text-ink/45">Protected</span> : (
                      <button onClick={() => toggle(u)} role="switch" aria-checked={Boolean(u.is_active)} aria-label={`Allow ${u.name} to sign in`}
                        className={`relative h-6 w-11 rounded-full transition ${u.is_active ? 'bg-moss' : 'bg-ink/20'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${u.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-ink/55">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
