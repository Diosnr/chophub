import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const CATEGORIES = [
  { id: 'live-catfish', label: 'Live catfish' },
  { id: 'frozen-chicken', label: 'Frozen chicken' },
  { id: 'cooked-food', label: 'Cooked food' },
];

interface Product {
  _id: string;
  name: string;
  category: string;
  pricingType: string;
  price: number;
  vendorId: { _id: string; businessName: string };
}

export default function Browse() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = category ? `?category=${category}` : '';
    api.get(`/api/products${params}`)
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
          <Link to="/cart" className="text-gray-700 hover:text-brand-600">Cart</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Browse</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm ${category === '' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-4 py-2 rounded-full text-sm ${category === c.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-2">No products yet.</p>
            <p className="text-sm text-gray-400">Vendors will list items here. Sign up as a vendor to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link
                key={p._id}
                to={`/product/${p._id}`}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center text-6xl">
                  {p.category === 'live-catfish' ? '🐟' : p.category === 'frozen-chicken' ? '🍗' : p.category === 'cooked-food' ? '🍲' : '📦'}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{p.vendorId?.businessName || 'Vendor'}</p>
                  <p className="text-lg font-bold text-brand-600">
                    ₦{p.price.toLocaleString()}
                    {p.pricingType === 'per-kg' ? '/kg' : p.pricingType === 'per-unit' ? '/pack' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
