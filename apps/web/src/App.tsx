import { useEffect, useState } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking...');

  useEffect(() => {
    const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
    fetch(apiUrl + '/api/health')
      .then((r) => r.json())
      .then((d) => setApiStatus(d.status || 'unknown'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-600">ChopHub</h1>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#" className="text-gray-700 hover:text-brand-600">Browse</a>
            <a href="#" className="text-gray-700 hover:text-brand-600">Vendors</a>
            <a href="#" className="text-gray-700 hover:text-brand-600">Login</a>
            <a href="#" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">Sign up</a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Fresh catfish, frozen chicken,<br />
          cooked African food — delivered.
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Marketplace connecting you with vendors across Lagos and beyond. Live catfish by weight, frozen chicken by pack, cooked food by plate.
        </p>
        <div className="flex gap-4 mb-12">
          <button className="bg-brand-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-brand-700">
            Browse vendors
          </button>
          <button className="border border-gray-300 px-6 py-3 rounded-lg text-lg font-semibold text-gray-700 hover:border-brand-600 hover:text-brand-600">
            Become a vendor
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            { title: 'Live catfish', desc: 'Fresh, sized to your weight. Pick 1kg, 2kg, 5kg — we handle the rest.' },
            { title: 'Frozen chicken', desc: 'Whole birds, halves, packs. Vendor-graded, ready for your freezer.' },
            { title: 'Cooked African food', desc: 'Jollof, pounded yam, egusi, more — straight from neighbourhood vendors.' },
          ].map((c) => (
            <div key={c.title} className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">{c.title}</h3>
              <p className="text-gray-600">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-sm text-gray-500">
          API status:{' '}
          <span className={apiStatus === 'ok' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {apiStatus}
          </span>
        </div>
      </main>
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-500">
          ChopHub — Lagos, Nigeria
        </div>
      </footer>
    </div>
  );
}

export default App;
