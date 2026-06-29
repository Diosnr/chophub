import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Setting {
  _id: string;
  key: string;
  value: number;
  description?: string;
}

interface DeliveryZone {
  _id: string;
  name: string;
  fee: number;
  estimatedDays?: number;
  active: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [referralReward, setReferralReward] = useState(500);
  const [saving, setSaving] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', fee: 0, estimatedDays: 1 });

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/api/admin/settings'),
      api.get('/api/admin/delivery-zones'),
    ]).then(([s, z]) => {
      setSettings(s.data);
      setZones(z.data);
      const df = s.data.find((x: Setting) => x.key === 'delivery_fee');
      const rr = s.data.find((x: Setting) => x.key === 'referral_reward');
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

  async function createZone(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/admin/delivery-zones', newZone);
      setNewZone({ name: '', fee: 0, estimatedDays: 1 });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not create zone';
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function updateZone(id: string, patch: Partial<DeliveryZone>) {
    setSaving(true);
    try {
      await api.put(`/api/admin/delivery-zones/${id}`, patch);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteZone(id: string) {
    if (!confirm('Delete this delivery zone? Customers will no longer be able to pick it at checkout.')) return;
    setSaving(true);
    try {
      await api.delete(`/api/admin/delivery-zones/${id}`);
      load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Default delivery fee (₦)</h3>
          <p className="text-sm text-gray-500 mb-3">Used as a fallback if no delivery zone is selected. Add proper zones below for location-based pricing.</p>
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

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Delivery zones</h3>
          <p className="text-sm text-gray-500 mb-4">Set per-location delivery fees. Customers pick their zone at checkout.</p>

          <form onSubmit={createZone} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <input
              type="text"
              required
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              placeholder="Zone name (e.g. Ado-Ekiti)"
              className="border border-gray-300 rounded px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              type="number"
              required
              value={newZone.fee}
              onChange={(e) => setNewZone({ ...newZone, fee: Number(e.target.value) })}
              placeholder="Fee (₦)"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={newZone.estimatedDays}
              onChange={(e) => setNewZone({ ...newZone, estimatedDays: Number(e.target.value) })}
              placeholder="Days"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <button type="submit" disabled={saving || !newZone.name} className="bg-brand-600 text-white rounded px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-50 sm:col-span-4">+ Add zone</button>
          </form>

          {zones.length === 0 ? (
            <p className="text-sm text-gray-500">No zones yet. Add one above to enable zone-based delivery fees at checkout.</p>
          ) : (
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {zones.map((zone) => (
                <div key={zone._id} className="p-3 flex items-center gap-3 bg-white">
                  <input
                    type="text"
                    defaultValue={zone.name}
                    onBlur={(e) => e.target.value !== zone.name && updateZone(zone._id, { name: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-0"
                  />
                  <input
                    type="number"
                    defaultValue={zone.fee}
                    onBlur={(e) => Number(e.target.value) !== zone.fee && updateZone(zone._id, { fee: Number(e.target.value) })}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                  />
                  <input
                    type="number"
                    defaultValue={zone.estimatedDays ?? ''}
                    onBlur={(e) => Number(e.target.value) !== (zone.estimatedDays ?? '') && updateZone(zone._id, { estimatedDays: Number(e.target.value) })}
                    placeholder="days"
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                  />
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={zone.active}
                      onChange={(e) => updateZone(zone._id, { active: e.target.checked })}
                    />
                    <span className={zone.active ? 'text-green-700' : 'text-gray-400'}>{zone.active ? 'Active' : 'Off'}</span>
                  </label>
                  <button onClick={() => deleteZone(zone._id)} disabled={saving} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}