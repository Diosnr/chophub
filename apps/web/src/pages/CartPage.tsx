import { Link } from 'react-router-dom';
import { useCart } from '../lib/cart';
import Header from '../components/Header';

export default function CartPage() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);

  function lineTotal(item: { pricingType: string; unitPrice: number; qty: number; weightKg?: number }) {
    if (item.pricingType === 'per-kg') return item.unitPrice * (item.weightKg || 0);
    return item.unitPrice * item.qty;
  }

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

  const byVendor = items.reduce((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = [];
    acc[item.vendorId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header /><main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Your cart</h2>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Your cart is empty.</p>
            <Link to="/browse" className="text-brand-600 font-semibold">Browse vendors →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(byVendor).map(([vendorId, vendorItems]) => (
                <div key={vendorId} className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{vendorItems[0].vendorName}</h3>
                  <div className="space-y-3">
                    {vendorItems.map((item) => (
                      <div key={item.productId} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.pricingType === 'per-kg'
                              ? `${item.weightKg?.toFixed(1)} kg × ₦${item.unitPrice.toLocaleString()}/kg`
                              : `${item.qty} × ₦${item.unitPrice.toLocaleString()}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{lineTotal(item).toLocaleString()}</p>
                          <button onClick={() => remove(item.productId)} className="text-sm text-red-600 hover:text-red-700 mt-1">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border border-gray-200 rounded-xl p-6 h-fit">
              <h3 className="font-semibold text-gray-900 mb-4">Order summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-gray-400">at checkout</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between font-bold text-lg mb-4">
                <span>Total</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <Link to="/checkout" className="block text-center w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700">
                Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
