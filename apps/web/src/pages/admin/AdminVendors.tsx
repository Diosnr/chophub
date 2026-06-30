import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface Vendor {
  _id: string;
  businessName: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userId?: { email: string; name: string };
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const toast = useToast((s) => s.push);

  function load() {
    setLoading(true);
    api.get('/api/admin/vendors')
      .then((r) => setVendors(r.data))
      .catch(() => toast('Could not load vendors', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function approve(v: Vendor) {
    if (actionId) return;
    setActionId(v._id);
    try {
      await api.post(`/api/vendors/${v._id}/approve`);
      toast(`Approved ${v.businessName}`, 'success');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Approval failed';
      toast(message, 'error');
    } finally {
      setActionId(null);
    }
  }

  async function reject(v: Vendor) {
    if (actionId) return;
    const reason = prompt(`Reason for rejecting ${v.businessName}? (Optional — included in the rejection email)`, '');
    if (reason === null) return; // cancelled
    setActionId(v._id);
    try {
      await api.post(`/api/vendors/${v._id}/reject`, { reason: reason.trim() || undefined });
      toast(`Rejected ${v.businessName}`, 'info');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Rejection failed';
      toast(message, 'error');
    } finally {
      setActionId(null);
    }
  }

  const filtered = filter === 'all' ? vendors : vendors.filter((v) => v.status === filter);
  const counts = {
    all: vendors.length,
    pending: vendors.filter((v) => v.status === 'pending').length,
    approved: vendors.filter((v) => v.status === 'approved').length,
    rejected: vendors.filter((v) => v.status === 'rejected').length,
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Vendors</h2>
      <p className="text-gray-600 mb-6">Approve or reject vendor applications.</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 text-sm overflow-x-auto">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No {filter === 'all' ? '' : filter} vendors.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const isActing = actionId === v._id;
            return (
              <div key={v._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{v.businessName}</h3>
                  <p className="text-sm text-gray-500 truncate">{v.userId?.email} — {v.userId?.name}</p>
                  {v.description && <p className="text-sm text-gray-700 mt-2">{v.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">Applied {new Date(v.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    v.status === 'approved' ? 'bg-green-100 text-green-700' :
                    v.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {v.status}
                  </span>
                  {v.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(v)}
                        disabled={isActing}
                        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        {isActing ? <><span className="btn-spinner" /> Approving...</> : 'Approve'}
                      </button>
                      <button
                        onClick={() => reject(v)}
                        disabled={isActing}
                        className="text-sm bg-white border border-red-300 text-red-700 px-3 py-1.5 rounded hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isActing ? <span className="btn-spinner" /> : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}