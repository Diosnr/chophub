import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

interface Vendor {
  _id: string;
  businessName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function VendorLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'vendor' && user.role !== 'admin') {
      // Not a vendor — show onboard page
      setLoading(false);
      return;
    }
    api.get('/api/vendors/me')
      .then((r) => setVendor(r.data))
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!vendor && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
          <p className="text-xs text-gray-400 mt-1">Vendor</p>
          <nav className="mt-8 space-y-1 flex-1">
            <Link to="/vendor/onboard" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Become a vendor</Link>
          </nav>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Signed in as <strong>{user.email}</strong></p>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-600 hover:text-red-700">Logout</button>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
        <p className="text-xs text-gray-400 mt-1">Vendor · {vendor?.businessName}</p>
        <nav className="mt-8 space-y-1 flex-1">
          <Link to="/vendor/products" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Products</Link>
          <Link to="/vendor/orders" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Orders</Link>
        </nav>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Signed in as <strong>{user.email}</strong></p>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-600 hover:text-red-700">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
