import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export default function Header() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const cartCount = useCart((s) => s.items.length);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';

  function close() { setMenuOpen(false); }

  function onLogout() {
    logout();
    close();
    navigate('/');
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-brand-600 shrink-0">ChopHub</Link>

          {/* Desktop nav (md and up) */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link to="/browse" className="text-gray-700 hover:text-brand-600">Browse</Link>
            {user && <Link to="/wallet" className="text-gray-700 hover:text-brand-600">Wallet</Link>}
            {user && (user.role === 'vendor' || isStaff) && (
              <Link to="/vendor/products" className="text-gray-700 hover:text-brand-600">Vendor</Link>
            )}
            {isStaff && <Link to="/admin" className="text-gray-700 hover:text-brand-600">Admin</Link>}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart icon — always visible */}
            <Link to="/cart" className="relative text-gray-700 hover:text-brand-600 p-2" aria-label="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 6h13" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-700 max-w-[120px] truncate">Hi, {user.name.split(' ')[0]}</span>
                  <button onClick={onLogout} className="text-sm text-gray-700 hover:text-brand-600">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-700 hover:text-brand-600">Login</Link>
                  <Link to="/signup" className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700">Sign up</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-brand-600"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
              <Link onClick={close} to="/browse" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Browse</Link>
              {user && (
                <Link onClick={close} to="/wallet" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Wallet</Link>
              )}
              {user && (user.role === 'vendor' || isStaff) && (
                <Link onClick={close} to="/vendor/products" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Vendor dashboard</Link>
              )}
              {isStaff && (
                <Link onClick={close} to="/admin" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Admin panel</Link>
              )}
              {user ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-3 py-2 text-sm text-gray-500">Signed in as <strong className="text-gray-900">{user.name}</strong></div>
                  <button onClick={onLogout} className="block w-full text-left px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium">Logout</button>
                </>
              ) : (
                <>
                  <Link onClick={close} to="/login" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Login</Link>
                  <Link onClick={close} to="/signup" className="block px-3 py-2.5 rounded-lg bg-brand-600 text-white text-center font-semibold">Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom tab bar — primary actions always reachable */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="grid grid-cols-4">
          <Link to="/" className="flex flex-col items-center py-2 text-gray-700 hover:text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-0.5">Home</span>
          </Link>
          <Link to="/browse" className="flex flex-col items-center py-2 text-gray-700 hover:text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs mt-0.5">Browse</span>
          </Link>
          <Link to={user ? "/orders" : "/login"} className="flex flex-col items-center py-2 text-gray-700 hover:text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-0.5">Orders</span>
          </Link>
          <Link to={user ? "/wallet" : "/login"} className="flex flex-col items-center py-2 text-gray-700 hover:text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-xs mt-0.5">Wallet</span>
          </Link>
        </div>
      </nav>
    </>
  );
}