import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

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
      setCode('');
      setValue(10);
      load();
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    await api.delete(`/api/admin/coupons/${id}`);
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Coupons</h2>
      <form onSubmit={create} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value as 'percent' | 'fixed')} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} placeholder="Value" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
        <input type="number" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} placeholder="Min order" className="border border-gray-300 rounded px-3 py-2 text-sm" />
        <button type="submit" disabled={creating} className="bg-brand-600 text-white rounded px-3 py-2 text-sm hover:bg-brand-700 disabled:opacity-50">{creating ? '...' : 'Create'}</button>
      </form>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-2">
          {coupons.length === 0 ? <p className="text-gray-500">No coupons yet.</p> :
            coupons.map((c) => (
              <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{c.code} — {c.type === 'percent' ? `${c.value}% off` : `₦${c.value} off`}</p>
                  <p className="text-xs text-gray-500">Min: ₦{c.minOrder} · Used: {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</p>
                </div>
                <button onClick={() => remove(c._id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
