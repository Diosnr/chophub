import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Vendor {
  _id: string;
  businessName: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userId?: { email: string; name: string };
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/api/admin/vendors').then((r) => setVendors(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    await api.post(`/api/vendors/${id}/approve`);
    load();
  }
  async function reject(id: string) {
    await api.post(`/api/vendors/${id}/reject`);
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Vendors</h2>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-3">
          {vendors.length === 0 ? <p className="text-gray-500">No vendors yet.</p> :
            vendors.map((v) => (
              <div key={v._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{v.businessName}</h3>
                  <p className="text-sm text-gray-500">{v.userId?.email} — {v.userId?.name}</p>
                  {v.description && <p className="text-sm text-gray-700 mt-2">{v.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">Applied {new Date(v.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${v.status === 'approved' ? 'bg-green-100 text-green-700' : v.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {v.status}
                  </span>
                  {v.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(v._id)} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button>
                      <button onClick={() => reject(v._id)} className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
