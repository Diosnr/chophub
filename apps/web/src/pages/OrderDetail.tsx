import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

interface Order {
  _id: string;
  customerId: string;
  items: Array<{ productId: string; name: string; qty: number; weightKg?: number; unitPrice: number; lineTotal: number }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryAddress: string;
  couponCode?: string;
  createdAt: string;
}

const STATUS_FLOW = ['pending', 'accepted', 'ready', 'dispatched', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/api/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || 'Order not found'}</p>
        <button onClick={() => navigate('/orders')} className="text-brand-600 underline">Back to orders</button>
      </div>
    );
  }

  const currentStep = STATUS_FLOW.indexOf(order.orderStatus);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
          <Link to="/orders" className="text-sm text-gray-700 hover:text-brand-600">All orders</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Order #{order._id.slice(-8)}</h2>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">₦{order.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500">paid via {order.paymentMethod}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-3">Status</h3>
          <div className="flex justify-between items-center text-xs">
            {STATUS_FLOW.map((s, idx) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold mb-1 ${idx <= currentStep ? 'bg-brand-600' : 'bg-gray-300'}`}>
                  {idx + 1}
                </div>
                <span className={idx <= currentStep ? 'text-brand-600 font-semibold' : 'text-gray-400'}>{s}</span>
              </div>
            ))}
          </div>
          {order.orderStatus === 'cancelled' && (
            <div className="mt-3 bg-red-50 text-red-700 p-2 rounded text-sm">Order cancelled</div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="space-y-2 text-sm">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {item.name} × {item.qty}{item.weightKg ? ` (${item.weightKg.toFixed(1)} kg)` : ''}
                </span>
                <span className="font-semibold">₦{item.lineTotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₦{order.subtotal.toLocaleString()}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>-₦{order.discount.toLocaleString()}</span></div>}
            <div className="flex justify-between"><span>Delivery</span><span>₦{order.deliveryFee.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span>₦{order.total.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-2">Delivery address</h3>
          <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          <p>Payment: <strong className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{order.paymentStatus}</strong></p>
        </div>
      </main>
    </div>
  );
}
