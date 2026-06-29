import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Order {
  _id: string;
  customerId: string;
  items: Array<{ productId: string; name: string; qty: number; weightKg?: number; lineTotal: number }>;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  deliveryAddress: string;
  createdAt: string;
}

const STATUSES = ['pending', 'accepted', 'ready', 'dispatched', 'delivered', 'cancelled'];

export default function VendorOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/api/orders/vendor/mine').then((r) => setOrders(r.data)).catch(() => setOrders([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    await api.patch(`/api/orders/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Incoming orders</h2>
      {loading ? <p>Loading...</p> : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">#{o._id.slice(-8)}</p>
                  <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()} · {o.paymentStatus}</p>
                </div>
                <p className="text-lg font-bold">₦{o.total.toLocaleString()}</p>
              </div>
              <div className="text-sm text-gray-700 mb-2 space-y-1">
                {o.items.map((item, idx) => (
                  <div key={idx}>
                    {item.name} × {item.qty}{item.weightKg ? ` (${item.weightKg.toFixed(1)} kg)` : ''} — ₦{item.lineTotal.toLocaleString()}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mb-2">Deliver to: {o.deliveryAddress}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <select value={o.orderStatus} onChange={(e) => setStatus(o._id, e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
