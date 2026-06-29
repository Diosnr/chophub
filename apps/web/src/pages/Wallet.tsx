import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Transaction {
  _id: string;
  kind: 'credit' | 'debit';
  source: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export default function Wallet() {
  const user = useAuth((s) => s.user);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.get('/api/wallet/balance'), api.get('/api/wallet/transactions')])
      .then(([b, t]) => {
        setBalance(b.data.balance);
        setTransactions(t.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function onTopup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTopupLoading(true);
    try {
      const res = await api.post('/api/wallet/topup/init', { amount });
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Top-up failed';
      setError(message);
      setTopupLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
          <Link to="/browse" className="text-gray-700 hover:text-brand-600">Browse</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Wallet</h2>
        {!user ? (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
            Please <Link to="/login" className="font-semibold">log in</Link> to access your wallet.
          </div>
        ) : (
          <>
            <div className="bg-brand-600 text-white rounded-xl p-6 mb-6">
              <p className="text-sm opacity-80">Balance</p>
              <p className="text-4xl font-bold">₦{balance.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-2">Use wallet to pay for orders without going through Monnify each time.</p>
            </div>
            <form onSubmit={onTopup} className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-3">Top up via Monnify</h3>
              {error && <div className="bg-red-50 text-red-700 p-2 rounded text-sm mb-3">{error}</div>}
              <div className="flex gap-2">
                <input type="number" min={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
                <button type="submit" disabled={topupLoading} className="bg-brand-600 text-white rounded px-4 py-2 text-sm hover:bg-brand-700 disabled:opacity-50">
                  {topupLoading ? 'Redirecting...' : 'Top up'}
                </button>
              </div>
            </form>
            <h3 className="font-semibold mb-3">Recent transactions</h3>
            {loading ? <p>Loading...</p> : transactions.length === 0 ? (
              <p className="text-gray-500 text-sm">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((t) => (
                  <div key={t._id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{t.description || t.source}</p>
                      <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()} · {t.source}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${t.kind === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.kind === 'credit' ? '+' : '-'}₦{t.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">Bal: ₦{t.balanceAfter.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
