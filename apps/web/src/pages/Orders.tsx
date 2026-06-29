import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Order {
  _id: string;
  items: Array<{
    productId: string;
    name: string;
    qty: number;
    weightKg?: number;
    lineTotal: number;
  }>;
  total: number;
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryAddress: string;
  createdAt: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/orders')
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
          <Link to="/browse" className="text-gray-700 hover:text-brand-600">Continue shopping</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Your orders</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No orders yet.</p>
            <Link to="/browse" className="text-brand-600 font-semibold">Browse vendors →</Link>
          </div>
        ) : (
          <div className="space-y-4">
                        {orders.map((order) => (
                          <Link key={order._id} to={`/orders/${order._id}`} className="block border border-gray-200 rounded-xl p-4 hover:border-brand-600 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm text-gray-500">Order #{order._id.slice(-8)}</p>
                                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">₦{order.total.toLocaleString()}</p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    order.paymentStatus === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : order.paymentStatus === 'failed'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-700 flex justify-between">
                                  <span>
                                    {item.name} × {item.qty}
                                    {item.weightKg ? ` (${item.weightKg.toFixed(1)} kg)` : ''}
                                  </span>
                                  <span className="text-gray-500">₦{item.lineTotal.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                              <span>Status: <strong>{order.orderStatus}</strong></span>
                              <span>{order.paymentMethod} · View details →</span>
                            </div>
                          </Link>
                        ))}
                      </div>
        )}
      </main>
    </div>
  );
}
