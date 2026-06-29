import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api'
import Header from '../components/Header';

interface Vendor {
  _id: string;
  businessName: string;
  description?: string;
  status: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  pricingType: string;
  price: number;
}

export default function VendorStorefront() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/api/vendors/${id}`),
      api.get(`/api/products?vendorId=${id}`),
    ])
      .then(([v, p]) => {
        setVendor(v.data);
        setProducts(p.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Vendor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !vendor) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-600">{error || 'Vendor not found'}</p>
      <Link to="/browse" className="text-brand-600 underline">Back to browse</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header /><main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">{vendor.businessName}</h2>
          {vendor.description && <p className="text-gray-600">{vendor.description}</p>}
          <p className="text-sm text-gray-500 mt-2">{products.length} {products.length === 1 ? 'product' : 'products'} listed</p>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No products listed yet.</p>
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
                  <p className="text-lg font-bold text-brand-600 mt-1">
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
