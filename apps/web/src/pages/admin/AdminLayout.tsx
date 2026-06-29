import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export default function AdminLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    navigate('/');
    return null;
  }

  const isSuperadmin = user.role === 'superadmin';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
        <p className="text-xs text-gray-400 mt-1">Admin panel</p>
        <nav className="mt-8 space-y-1 flex-1">
          <Link to="/admin/vendors" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Vendors</Link>
          <Link to="/admin/coupons" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Coupons</Link>
          <Link to="/admin/settings" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Settings</Link>
          <Link to="/admin/orders" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Orders</Link>
          {isSuperadmin && (
            <Link to="/admin/admins" className="block px-3 py-2 rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100 text-sm font-medium">
              Admins
            </Link>
          )}
        </nav>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Signed in as</p>
          <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
          <p className="text-xs text-brand-600 font-semibold mt-1">{user.role}</p>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-600 hover:text-red-700 mt-3">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}