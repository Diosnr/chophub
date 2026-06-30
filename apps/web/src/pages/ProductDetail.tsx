import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api'
import Header from '../components/Header';
import QuantityStepper from '../components/QuantityStepper';
import WeightSelector from '../components/WeightSelector';
import { useCart } from '../lib/cart';

interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  pricingType: 'fixed' | 'per-kg' | 'per-unit';
  price: number;
  stock: number;
  vendorId: { _id: string; businessName: string };
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [weightKg, setWeightKg] = useState(1);
  const addToCart = useCart((s) => s.add);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-16">Loading...</div>;
  if (!product) return <div className="max-w-6xl mx-auto px-4 py-16">Product not found.</div>;

  const isPerKg = product.pricingType === 'per-kg';
  const total = isPerKg ? product.price * weightKg : product.price * qty;
  const inStock = product.stock > 0;

  function handleAdd() {
    if (!inStock) return;
    addToCart({
      productId: product._id,
      vendorId: product.vendorId?._id || product.vendorId,
      name: product.name,
      vendorName: product.vendorId?.businessName || 'Vendor',
      pricingType: product.pricingType,
      unitPrice: product.price,
      qty: isPerKg ? 1 : qty,
      weightKg: isPerKg ? weightKg : undefined,
    });
    navigate('/cart');
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/browse" className="text-sm text-gray-500 hover:text-brand-600 mb-4 inline-block">← Back to browse</Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-8xl">
            {product.category === 'live-catfish' ? '🐟' : product.category === 'frozen-chicken' ? '🍗' : product.category === 'cooked-food' ? '🍲' : '📦'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.vendorId?.businessName}</p>
            <p className="text-3xl font-bold text-brand-600 mb-6">
              ₦{product.price.toLocaleString()}
              {isPerKg ? '/kg' : product.pricingType === 'per-unit' ? '/pack' : ''}
            </p>
            {product.description && <p className="text-gray-700 mb-6">{product.description}</p>}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              {!inStock ? (
                <div className="text-center py-4">
                  <p className="text-red-600 font-semibold">Out of stock</p>
                  <p className="text-sm text-gray-500 mt-1">Check back later or browse other vendors</p>
                </div>
              ) : isPerKg ? (
                <WeightSelector value={weightKg} onChange={setWeightKg} min={0.5} max={10} />
              ) : (
                <QuantityStepper value={qty} onChange={setQty} min={1} max={product.stock} />
              )}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">₦{total.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                inStock
                  ? 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.99]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {inStock ? 'Add to cart' : 'Out of stock'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}