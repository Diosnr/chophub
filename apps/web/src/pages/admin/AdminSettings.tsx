import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Setting {
  _id: string;
  key: string;
  value: number;
  description?: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [referralReward, setReferralReward] = useState(500);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get('/api/admin/settings').then((r) => {
      setSettings(r.data);
      const df = r.data.find((s: Setting) => s.key === 'delivery_fee');
      const rr = r.data.find((s: Setting) => s.key === 'referral_reward');
      if (df) setDeliveryFee(df.value);
      if (rr) setReferralReward(rr.value);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function save(key: string, value: number) {
    setSaving(true);
    try {
      await api.put(`/api/admin/settings/${key}`, { value });
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Delivery fee (₦)</h3>
            <p className="text-sm text-gray-500 mb-3">Flat fee added to every order.</p>
            <div className="flex gap-2">
              <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-2 text-sm flex-1" />
              <button onClick={() => save('delivery_fee', deliveryFee)} disabled={saving} className="bg-brand-600 text-white rounded px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-50">Save</button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Referral reward (₦)</h3>
            <p className="text-sm text-gray-500 mb-3">Wallet credit for both referrer and referred user on first purchase.</p>
            <div className="flex gap-2">
              <input type="number" value={referralReward} onChange={(e) => setReferralReward(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-2 text-sm flex-1" />
              <button onClick={() => save('referral_reward', referralReward)} disabled={saving} className="bg-brand-600 text-white rounded px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
