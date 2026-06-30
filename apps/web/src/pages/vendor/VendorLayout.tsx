import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

interface Vendor {
  _id: string;
  businessName: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
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

  // Customer (no vendor record) — show CTA to apply
  if (!vendor && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
          <p className="text-xs text-gray-400 mt-1">Vendor</p>
          <nav className="mt-8 space-y-1 flex-1">
            <Link to="/vendor/onboard" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Become a vendor</Link>
            <Link to="/settings" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Settings</Link>
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

  // Approved vendor — show normal dashboard
  if (vendor?.status === 'approved' || user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
          <p className="text-xs text-gray-400 mt-1">Vendor · {vendor?.businessName}</p>
          <nav className="mt-8 space-y-1 flex-1">
            <Link to="/vendor/products" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Products</Link>
            <Link to="/vendor/orders" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Orders</Link>
            <Link to="/settings" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Settings</Link>
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

  // Pending or rejected — show status banner
  const isPending = vendor?.status === 'pending';
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
        <p className="text-xs text-gray-400 mt-1">Vendor · {vendor?.businessName}</p>
        <nav className="mt-8 space-y-1 flex-1">
          <Link to="/settings" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Settings</Link>
        </nav>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Signed in as <strong>{user.email}</strong></p>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-600 hover:text-red-700">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {isPending ? (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Application under review</h2>
            <p className="text-gray-600 mb-6">
              Thanks for applying, <strong>{vendor?.businessName}</strong>. Our team is reviewing your application. We'll email you at <strong>{user.email}</strong> within 1–2 days with a decision.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">What happens next</h3>
              <ul className="text-sm text-yellow-800 space-y-1.5 list-disc list-inside">
                <li>We check that your business name and description are clear and complete.</li>
                <li>We confirm the contact details on your account are reachable.</li>
                <li>You'll get an email at this address when you're approved (or if we need anything else).</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold mb-2">While you wait</h3>
              <p className="text-sm text-gray-600 mb-3">Top vendors on ChopHub have 5+ products listed in their first week. Start thinking about which products you'll list and what photos you have ready.</p>
              <p className="text-sm text-gray-600">Once approved, you'll be able to add products, see orders, and start selling.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Application not approved</h2>
            <p className="text-gray-600 mb-6">
              Your application for <strong>{vendor?.businessName}</strong> wasn't approved this time. We sent details to <strong>{user.email}</strong> — most declined applications get approved on reapply once the description is clearer.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">Common reasons for a decline</h3>
              <ul className="text-sm text-red-800 space-y-1.5 list-disc list-inside">
                <li>Business description is too short or vague ("we sell food" won't pass; "fresh catfish from Ekiti, sold by weight" will).</li>
                <li>No clear location or delivery area.</li>
                <li>Business name doesn't match what's being sold.</li>
              </ul>
            </div>
            <Link to="/" className="inline-block bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-brand-700">
              Back to browsing
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}