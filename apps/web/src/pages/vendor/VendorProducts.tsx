import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ProductForm from '../../components/ProductForm';
import type { ProductData } from '../../components/ProductForm';

interface Product extends ProductData {
  _id: string;
  status: 'active' | 'inactive';
}

const CATEGORY_LABELS: Record<string, string> = {
  'live-catfish': 'Live catfish',
  'frozen-chicken': 'Frozen chicken',
  'cooked-food': 'Cooked food',
  other: 'Other',
};

const PRICING_BADGE: Record<string, string> = {
  fixed: '₦/item',
  'per-kg': '₦/kg',
  'per-unit': '₦/pack',
};

export default function VendorProducts() {
  const toast = useToast((s) => s.push);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get('/api/products/mine')
      .then((r) => setProducts(r.data))
      .catch(() => {
        toast('Failed to load products', 'error');
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }

  async function toggleStatus(p: Product) {
    const next = p.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/api/products/${p._id}`, { status: next });
      toast(next === 'active' ? `${p.name} is now visible to customers` : `${p.name} is hidden`, 'success');
      load();
    } catch {
      toast('Failed to update status', 'error');
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    const target = products.find((p) => p._id === deletingId);
    try {
      await api.delete(`/api/products/${deletingId}`);
      toast(`${target?.name || 'Product'} deleted`, 'success');
      setDeletingId(null);
      load();
    } catch {
      toast('Delete failed', 'error');
    }
  }

  function onSaved() {
    load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your products</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} {products.length === 1 ? 'product' : 'products'} listed
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-brand-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-brand-700 active:scale-[0.99] flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="text-lg leading-none">+</span>
          Add product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="font-semibold text-gray-900 mb-1">No products yet</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
            Add your first product — customers can start ordering once it's listed.
          </p>
          <button
            onClick={openAdd}
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-700"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {p.images?.[0] ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                ) : p.category === 'live-catfish' ? (
                  '🐟'
                ) : p.category === 'frozen-chicken' ? (
                  '🍗'
                ) : p.category === 'cooked-food' ? (
                  '🍲'
                ) : (
                  '📦'
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                  {p.status === 'inactive' && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full flex-shrink-0">Hidden</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                  <span>{CATEGORY_LABELS[p.category] || p.category}</span>
                  <span>·</span>
                  <span className="font-semibold text-brand-600">
                    ₦{p.price.toLocaleString()}{PRICING_BADGE[p.pricingType] ? ` ${PRICING_BADGE[p.pricingType]}` : ''}
                  </span>
                  {p.pricingType !== 'per-kg' && (
                    <>
                      <span>·</span>
                      <span>{p.stock ?? 0} in stock</span>
                    </>
                  )}
                </div>
                {p.description && (
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{p.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 sm:flex-shrink-0">
                <button
                  onClick={() => toggleStatus(p)}
                  className={`text-xs px-3 py-2 rounded-lg font-medium transition active:scale-95 ${
                    p.status === 'active'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {p.status === 'active' ? 'Active' : 'Hidden'}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs px-3 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(p._id)}
                  className="text-xs px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form modal */}
      {formOpen && (
        <ProductForm
          initial={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-in"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-2">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this product?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <strong>{products.find((p) => p._id === deletingId)?.name}</strong> will be removed
              for customers. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 active:scale-[0.99]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}