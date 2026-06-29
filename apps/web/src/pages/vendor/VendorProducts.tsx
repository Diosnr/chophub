import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Product {
  _id: string;
  name: string;
  category: string;
  pricingType: 'fixed' | 'per-kg' | 'per-unit';
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

const CATEGORIES = ['live-catfish', 'frozen-chicken', 'cooked-food', 'other'];

export default function VendorProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('cooked-food');
  const [pricingType, setPricingType] = useState<'fixed' | 'per-kg' | 'per-unit'>('fixed');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get('/api/products/mine').then((r) => setProducts(r.data)).catch(() => setProducts([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/products', { name, category, pricingType, price, stock });
      setName(''); setPrice(0); setStock(0);
      setAdding(false);
      load();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Add failed';
      setError(message);
    }
  }

  async function toggleStatus(p: Product) {
    await api.patch(`/api/products/${p._id}`, { status: p.status === 'active' ? 'inactive' : 'active' });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/api/products/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your products</h2>
        <button onClick={() => setAdding(!adding)} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
          {adding ? 'Cancel' : '+ Add product'}
        </button>
      </div>
      {adding && (
        <form onSubmit={onAdd} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
          {error && <div className="md:col-span-6 bg-red-50 text-red-700 p-2 rounded text-sm">{error}</div>}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" required className="md:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as 'fixed' | 'per-kg' | 'per-unit')} className="border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="fixed">Fixed</option>
            <option value="per-kg">Per kg</option>
            <option value="per-unit">Per pack</option>
          </select>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price (₦)" required className="border border-gray-300 rounded px-3 py-2 text-sm" />
          <button type="submit" className="bg-brand-600 text-white rounded px-3 py-2 text-sm hover:bg-brand-700">Add</button>
        </form>
      )}
      {loading ? <p>Loading...</p> : products.length === 0 ? (
        <p className="text-gray-500">No products yet. Add your first one above.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.category} · {p.pricingType} · ₦{p.price.toLocaleString()}{p.pricingType === 'per-kg' ? '/kg' : p.pricingType === 'per-unit' ? '/pack' : ''} · stock {p.stock}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleStatus(p)} className={`text-xs px-3 py-1 rounded ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                  {p.status}
                </button>
                <button onClick={() => remove(p._id)} className="text-xs text-red-600 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
