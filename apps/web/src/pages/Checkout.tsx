import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface CartItem {
  productId: string;
  vendorId: string;
  name: string;
  vendorName: string;
  pricingType: 'fixed' | 'per-kg' | 'per-unit';
  unitPrice: number;
  qty: number;
  weightKg?: number;
}

function lineTotal(item: CartItem): number {
  if (item.pricingType === 'per-kg') return item.unitPrice * (item.weightKg || 0);
  return item.unitPrice * item.qty;
}

export default function Checkout() {
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [coupon, setCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'monnify' | 'wallet'>('monnify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

  async function onPlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const orderRes = await api.post('/api/orders', {
        items: items.map((i: CartItem) => ({
          productId: i.productId,
          qty: i.qty,
          weightKg: i.weightKg,
        })),
        deliveryAddress: address,
        couponCode: coupon || undefined,
        paymentMethod,
      });
      const order = orderRes.data;

      if (paymentMethod === 'monnify') {
        const payRes = await api.post(`/api/payments/monnify/init/${order._id}`);
        clearCart();
        window.location.href = payRes.data.checkoutUrl;
      } else {
        clearCart();
        navigate(`/orders`);
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Checkout failed';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Checkout</h2>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={onPlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery address</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Street, area, city, landmarks..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coupon code (optional)</label>
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-brand-600">
                  <input type="radio" checked={paymentMethod === 'monnify'} onChange={() => setPaymentMethod('monnify')} />
                  <div>
                    <div className="font-medium">Pay with Monnify</div>
                    <div className="text-sm text-gray-500">Card, bank transfer, USSD</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer opacity-60">
                  <input type="radio" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} disabled />
                  <div>
                    <div className="font-medium">Pay with wallet</div>
                    <div className="text-sm text-gray-500">Balance: ₦{user.walletBalance.toLocaleString()} (top-up coming soon)</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-6 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Order summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({items.length} items)</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="text-gray-400">at order confirmation</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !address}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Placing order...' : 'Place order & pay'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
