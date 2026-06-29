import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const toast = useToast((s) => s.push);

  function load() {
    setLoading(true);
    api.get('/api/admin/orders').then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function setStatus(o: Order, status: string) {
    if (updatingId) return;
    setUpdatingId(o._id);
    try {
      await api.patch(`/api/orders/${o._id}/status`, { status });
      toast(`Order #${o._id.slice(-8)} → ${status}`, 'success');
      // refresh quietly
      api.get('/api/admin/orders').then((r) => setOrders(r.data));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not update status';
      toast(msg, 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">All orders</h2>
      <p className="text-gray-600 mb-6">Update order status as it progresses through the lifecycle.</p>
      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="space-y-3">
          {orders.length === 0 ? <p className="text-gray-500">No orders yet.</p> :
            orders.map((o) => {
              const isUpdating = updatingId === o._id;
              return (
                <div key={o._id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">#{o._id.slice(-8)}</p>
                      <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()} · {o.paymentMethod} · {o.paymentStatus}</p>
                    </div>
                    <p className="text-lg font-bold">₦{o.total.toLocaleString()}</p>
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    {o.items.length} items · {o.deliveryAddress}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Order status:</span>
                    <div className="relative">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => setStatus(o, e.target.value)}
                        disabled={isUpdating}
                        className="border border-gray-300 rounded px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {isUpdating && <span className="btn-spinner absolute -right-5 top-1 text-brand-600" />}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}