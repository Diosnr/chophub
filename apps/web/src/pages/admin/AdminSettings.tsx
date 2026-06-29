import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';

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
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [zoneCreating, setZoneCreating] = useState(false);
  const [zoneActingId, setZoneActingId] = useState<string | null>(null);
  const [newZone, setNewZone] = useState({ name: '', fee: 0, estimatedDays: 1 });
  const toast = useToast((s) => s.push);

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

  async function save(key: string, label: string, value: number) {
    setSavingKey(key);
    try {
      await api.put(`/api/admin/settings/${key}`, { value });
      toast(`${label} saved`, 'success');
      // refresh quietly
      api.get('/api/admin/settings').then((r) => setSettings(r.data));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not save';
      toast(msg, 'error');
    } finally {
      setSavingKey(null);
    }
  }

  async function createZone(e: React.FormEvent) {
    e.preventDefault();
    setZoneCreating(true);
    try {
      const r = await api.post('/api/admin/delivery-zones', newZone);
      toast(`Zone "${r.data.name}" added`, 'success');
      setNewZone({ name: '', fee: 0, estimatedDays: 1 });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not create zone';
      toast(msg, 'error');
    } finally {
      setZoneCreating(false);
    }
  }

  async function updateZone(zone: DeliveryZone, patch: Partial<DeliveryZone>, label: string) {
    setZoneActingId(zone._id);
    try {
      await api.put(`/api/admin/delivery-zones/${zone._id}`, patch);
      toast(`${label} updated`, 'success');
      api.get('/api/admin/delivery-zones').then((r) => setZones(r.data));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not update zone';
      toast(msg, 'error');
    } finally {
      setZoneActingId(null);
    }
  }

  async function deleteZone(zone: DeliveryZone) {
    if (!confirm(`Delete zone "${zone.name}"? Customers will no longer be able to pick it at checkout.`)) return;
    setZoneActingId(zone._id);
    try {
      await api.delete(`/api/admin/delivery-zones/${zone._id}`);
      toast(`Zone "${zone.name}" deleted`, 'info');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not delete';
      toast(msg, 'error');
    } finally {
      setZoneActingId(null);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Settings</h2>
      <p className="text-gray-600 mb-6">Platform-wide configuration. Changes apply immediately.</p>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Default delivery fee (₦)</h3>
          <p className="text-sm text-gray-500 mb-3">Used as a fallback if no delivery zone is selected. Add proper zones below for location-based pricing.</p>
          <div className="flex gap-2">
            <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-2 text-sm flex-1" />
            <button
              onClick={() => save('delivery_fee', 'Delivery fee', deliveryFee)}
              disabled={savingKey === 'delivery_fee'}
              className="bg-brand-600 text-white rounded px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5 min-w-[80px] justify-center"
            >
              {savingKey === 'delivery_fee' ? <><span className="btn-spinner" /> Saving</> : 'Save'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Referral reward (₦)</h3>
          <p className="text-sm text-gray-500 mb-3">Wallet credit for both referrer and referred user on first purchase.</p>
          <div className="flex gap-2">
            <input type="number" value={referralReward} onChange={(e) => setReferralReward(Number(e.target.value))} className="border border-gray-300 rounded px-3 py-2 text-sm flex-1" />
            <button
              onClick={() => save('referral_reward', 'Referral reward', referralReward)}
              disabled={savingKey === 'referral_reward'}
              className="bg-brand-600 text-white rounded px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5 min-w-[80px] justify-center"
            >
              {savingKey === 'referral_reward' ? <><span className="btn-spinner" /> Saving</> : 'Save'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Delivery zones</h3>
          <p className="text-sm text-gray-500 mb-4">Set per-location delivery fees. Customers pick their zone at checkout. Edit any field — saves on blur.</p>

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
            <button
              type="submit"
              disabled={zoneCreating || !newZone.name}
              className="bg-brand-600 text-white rounded px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed sm:col-span-4 inline-flex items-center justify-center gap-1.5"
            >
              {zoneCreating ? <><span className="btn-spinner" /> Adding...</> : '+ Add zone'}
            </button>
          </form>

          {zones.length === 0 ? (
            <p className="text-sm text-gray-500">No zones yet. Add one above to enable zone-based delivery fees at checkout.</p>
          ) : (
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {zones.map((zone) => {
                const isActing = zoneActingId === zone._id;
                return (
                  <div key={zone._id} className="p-3 flex items-center gap-3 bg-white">
                    <input
                      type="text"
                      defaultValue={zone.name}
                      onBlur={(e) => e.target.value !== zone.name && updateZone(zone, { name: e.target.value }, `Zone "${zone.name}" name`)}
                      disabled={isActing}
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-0 disabled:opacity-50"
                    />
                    <input
                      type="number"
                      defaultValue={zone.fee}
                      onBlur={(e) => Number(e.target.value) !== zone.fee && updateZone(zone, { fee: Number(e.target.value) }, `Zone "${zone.name}" fee`)}
                      disabled={isActing}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-24 disabled:opacity-50"
                    />
                    <input
                      type="number"
                      defaultValue={zone.estimatedDays ?? ''}
                      onBlur={(e) => Number(e.target.value) !== (zone.estimatedDays ?? '') && updateZone(zone, { estimatedDays: Number(e.target.value) }, `Zone "${zone.name}" ETA`)}
                      disabled={isActing}
                      placeholder="days"
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-20 disabled:opacity-50"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={zone.active}
                        disabled={isActing}
                        onChange={(e) => updateZone(zone, { active: e.target.checked }, `Zone "${zone.name}" ${e.target.checked ? 'activated' : 'deactivated'}`)}
                      />
                      <span className={zone.active ? 'text-green-700' : 'text-gray-400'}>{zone.active ? 'Active' : 'Off'}</span>
                    </label>
                    <button
                      onClick={() => deleteZone(zone)}
                      disabled={isActing}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {isActing ? <><span className="btn-spinner" /> Working...</> : 'Delete'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}