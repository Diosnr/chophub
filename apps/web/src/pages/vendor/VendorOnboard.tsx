import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function VendorOnboard() {
  const setAuth = useAuth((s) => s.setAuth);
  const user = useAuth((s) => s.user);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/vendors', { businessName, description });
      if (user) setAuth({ ...user, role: 'vendor' }, useAuth.getState().token!);
      setDone(true);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Application failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Application submitted</h2>
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
          Your vendor application is pending admin approval. We'll email you when it's approved.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Become a vendor</h2>
      <p className="text-gray-600 mb-6">List your catfish, frozen chicken, or cooked African food on ChopHub.</p>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Mama Tola's Kitchen" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="What you sell, your speciality..." />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
