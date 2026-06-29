import { useEffect, useState } from 'react';
import { listAdmins, searchUsers, promoteToAdmin, demoteAdmin } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface AdminRow {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  emailVerified: boolean;
  walletBalance: number;
  createdAt: string;
}

interface SearchRow {
  _id: string;
  email: string;
  name: string;
  role: 'customer' | 'vendor' | 'admin' | 'superadmin';
  emailVerified: boolean;
  walletBalance: number;
}

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const toast = useToast((s) => s.push);

  async function loadAdmins() {
    setLoading(true);
    try {
      const list = await listAdmins();
      setAdmins(list);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not load admins';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const list = await searchUsers(q);
        setResults(list.filter((u) => u.role !== 'superadmin'));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  async function onPromote(u: SearchRow) {
    if (actionId) return;
    setActionId(u._id);
    try {
      await promoteToAdmin(u._id);
      toast(`${u.email} promoted to admin`, 'success');
      await loadAdmins();
      setSearch('');
      setResults([]);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not promote';
      toast(message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function onDemote(a: AdminRow) {
    if (actionId) return;
    if (!confirm(`Demote ${a.email} back to customer? They will lose all admin access.`)) return;
    setActionId(a._id);
    try {
      await demoteAdmin(a._id);
      toast(`${a.email} demoted to customer`, 'info');
      await loadAdmins();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not demote';
      toast(message, 'error');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin management</h1>
      <p className="text-gray-600 mb-8">Promote trusted users to admin. Only superadmins can manage admins.</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current admins</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-gray-500">No admins yet. Promote someone below.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {admins.map((a) => {
              const isActing = actionId === a._id;
              return (
                <div key={a._id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-sm text-gray-500">{a.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${a.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {a.role}
                    </span>
                    {a.role === 'admin' && (
                      <button
                        onClick={() => onDemote(a)}
                        disabled={isActing}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {isActing ? <><span className="btn-spinner" /> Demoting...</> : 'Demote'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Promote a user</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600 mb-3"
        />
        {searching && <p className="text-sm text-gray-500">Searching...</p>}
        {!searching && search.length >= 2 && results.length === 0 && (
          <p className="text-sm text-gray-500">No users match "{search}".</p>
        )}
        {results.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200 max-w-2xl">
            {results.map((u) => {
              const isActing = actionId === u._id;
              return (
                <div key={u._id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-400 mt-1">current role: {u.role}</p>
                  </div>
                  <button
                    onClick={() => onPromote(u)}
                    disabled={isActing || u.role === 'admin'}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    {isActing ? <><span className="btn-spinner" /> Promoting...</> : u.role === 'admin' ? 'Already admin' : 'Promote to admin'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}