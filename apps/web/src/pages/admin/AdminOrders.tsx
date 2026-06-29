import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Order {
  _id: string;
  customerId: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  deliveryAddress: string;
  createdAt: string;
  items: Array<{ name: string; qty: number; lineTotal: number }>;
}

const STATUSES = ['pending', 'accepted', 'ready', 'dispatched', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/api/admin/orders').then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    await api.patch(`/api/orders/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All orders</h2>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-3">
          {orders.length === 0 ? <p className="text-gray-500">No orders yet.</p> :
            orders.map((o) => (
              <div key={o._id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">#{o._id.slice(-8)}</p>
                    <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()} · {o.paymentMethod} · {o.paymentStatus}</p>
                  </div>
                  <p className="text-lg font-bold">₦{o.total.toLocaleString()}</p>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  {o.items.length} items · {o.deliveryAddress}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Order status:</span>
                  <select value={o.orderStatus} onChange={(e) => setStatus(o._id, e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
