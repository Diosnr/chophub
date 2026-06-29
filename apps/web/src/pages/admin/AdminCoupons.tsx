import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';

interface Coupon {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast((s) => s.push);

  function load() {
    setLoading(true);
    api.get('/api/admin/coupons').then((r) => setCoupons(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/admin/coupons', { code, type, value, minOrder });
      toast(`Coupon ${code} created`, 'success');
      setCode('');
      setValue(10);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not create coupon';
      toast(msg, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function remove(c: Coupon) {
    if (deletingId) return;
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    setDeletingId(c._id);
    try {
      await api.delete(`/api/admin/coupons/${c._id}`);
      toast(`Coupon ${c.code} deleted`, 'info');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not delete';
      toast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Coupons</h2>
      <p className="text-gray-600 mb-6">Discount codes for customers. Percent or fixed-amount off any order above a minimum.</p>
      <form onSubmit={create} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value as 'percent' | 'fixed')} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} placeholder="Value" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
        <input type="number" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} placeholder="Min order" className="border border-gray-300 rounded px-3 py-2 text-sm" />
        <button type="submit" disabled={creating} className="bg-brand-600 text-white rounded px-3 py-2 text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5">
          {creating ? <><span className="btn-spinner" /> Creating...</> : 'Create'}
        </button>
      </form>
      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="space-y-2">
          {coupons.length === 0 ? <p className="text-gray-500">No coupons yet.</p> :
            coupons.map((c) => (
              <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{c.code} — {c.type === 'percent' ? `${c.value}% off` : `₦${c.value} off`}</p>
                  <p className="text-xs text-gray-500">Min: ₦{c.minOrder} · Used: {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</p>
                </div>
                <button
                  onClick={() => remove(c)}
                  disabled={deletingId === c._id}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {deletingId === c._id ? <><span className="btn-spinner" /> Deleting...</> : 'Delete'}
                </button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}