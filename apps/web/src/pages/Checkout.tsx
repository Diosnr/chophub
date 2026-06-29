import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Header from '../components/Header';

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

interface DeliveryZone {
  _id: string;
  name: string;
  fee: number;
  estimatedDays?: number;
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
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneId, setZoneId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/delivery-zones').then((r) => {
      setZones(r.data);
      if (r.data.length > 0) setZoneId(r.data[0]._id);
    }).catch(() => {});
  }, []);

  if (!user) {
    navigate('/login');
    return null;
  }
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const selectedZone = zones.find((z) => z._id === zoneId);
  const deliveryFee = selectedZone?.fee ?? 0;
  const total = subtotal + deliveryFee;

  async function onPlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedZone) {
      setError('Please select a delivery zone');
      return;
    }
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
        deliveryZone: selectedZone.name,
        deliveryFee,
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
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header />
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

            {zones.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery zone</label>
                <div className="space-y-2">
                  {zones.map((zone) => (
                    <label
                      key={zone._id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-brand-600 ${
                        zoneId === zone._id ? 'border-brand-600 bg-brand-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="deliveryZone"
                          checked={zoneId === zone._id}
                          onChange={() => setZoneId(zone._id)}
                        />
                        <div>
                          <div className="font-medium">{zone.name}</div>
                          {zone.estimatedDays != null && (
                            <div className="text-sm text-gray-500">~{zone.estimatedDays} day{zone.estimatedDays === 1 ? '' : 's'}</div>
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {zone.fee === 0 ? 'Free' : `₦${zone.fee.toLocaleString()}`}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
                <span className="text-gray-600">Delivery {selectedZone && `(${selectedZone.name})`}</span>
                <span>{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-brand-600">₦{total.toLocaleString()}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !address || zones.length === 0}
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