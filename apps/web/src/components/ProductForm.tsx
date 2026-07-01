import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from './Toast';

export type ProductData = {
  _id?: string;
  name: string;
  description?: string;
  images?: string[];
  category: string;
  pricingType: 'fixed' | 'per-kg' | 'per-unit';
  price: number;
  stock?: number;
  status?: 'active' | 'inactive';
};

interface Props {
  initial?: ProductData | null;
  onClose: () => void;
  onSaved: (p: ProductData) => void;
}

const CATEGORIES = [
  { value: 'live-catfish', label: 'Live catfish' },
  { value: 'frozen-chicken', label: 'Frozen chicken' },
  { value: 'cooked-food', label: 'Cooked food' },
  { value: 'other', label: 'Other' },
];

const PRICE_HINTS: Record<string, string> = {
  fixed: 'Price per item',
  'per-kg': 'Price per kilogram',
  'per-unit': 'Price per pack',
};

export default function ProductForm({ initial, onClose, onSaved }: Props) {
  const toast = useToast((s) => s.push);
  const isEdit = !!initial?._id;

  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0] || '');
  const [category, setCategory] = useState(initial?.category || 'cooked-food');
  const [pricingType, setPricingType] = useState<ProductData['pricingType']>(initial?.pricingType || 'fixed');
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [stock, setStock] = useState<number>(initial?.stock ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset when initial changes (e.g. opening for edit)
  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setDescription(initial.description || '');
      setImageUrl(initial.images?.[0] || '');
      setCategory(initial.category || 'cooked-food');
      setPricingType(initial.pricingType || 'fixed');
      setPrice(initial.price ?? 0);
      setStock(initial.stock ?? 0);
    }
  }, [initial]);

  const pricePlaceholder = pricingType === 'per-kg' ? 'e.g. 3500' : pricingType === 'per-unit' ? 'e.g. 4500' : 'e.g. 2500';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setSubmitting(true);
    const payload: ProductData = {
      name: name.trim(),
      description: description.trim() || undefined,
      images: imageUrl.trim() ? [imageUrl.trim()] : [],
      category,
      pricingType,
      price,
      ...(pricingType !== 'per-kg' ? { stock } : {}),
    };

    try {
      const r = isEdit
        ? await api.patch(`/api/products/${initial!._id}`, payload)
        : await api.post('/api/products', payload);
      toast(isEdit ? 'Product updated' : 'Product added — visible to customers now', 'success');
      onSaved(r.data);
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (isEdit ? 'Update failed' : 'Add failed');
      setError(message);
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-in" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — drag handle on mobile, sticky */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit product' : 'Add product'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? 'Update the details below' : 'List a new product for customers to order'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Live Catfish — 2kg, Smoked Catfish — 500g"
              maxLength={80}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{name.length}/80</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's special about this product? Origin, prep, freshness, etc."
              rows={3}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 flex justify-between">
              <span>Helps customers pick you over the competition</span>
              <span>{description.length}/500</span>
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
            />
            {imageUrl && (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={imageUrl} alt="" className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-200" onError={(e) => (e.currentTarget.style.display = 'none')} />
            )}
            <p className="text-xs text-gray-400 mt-1">Paste a link to a hosted image (your own CDN, social, etc.)</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition active:scale-95 ${
                      active
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'fixed' as const, label: 'Fixed', sub: 'one item' },
                  { value: 'per-kg' as const, label: 'Per kg', sub: 'by weight' },
                  { value: 'per-unit' as const, label: 'Per pack', sub: 'per pack' },
                ]
              ).map((opt) => {
                const active = pricingType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPricingType(opt.value)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition active:scale-95 ${
                      active
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-xs opacity-70 font-normal">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₦) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min={1}
                  step={pricingType === 'per-kg' ? 100 : 50}
                  placeholder={pricePlaceholder}
                  required
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{PRICE_HINTS[pricingType]}</p>
            </div>

            {pricingType !== 'per-kg' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
                  min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Units available now</p>
              </div>
            )}
          </div>
        </form>

        {/* Sticky footer */}
        <div className="border-t border-gray-200 px-5 py-3 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 active:scale-[0.99]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
            disabled={submitting}
            className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}