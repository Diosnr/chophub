import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { updateProfile, changePassword } from '../lib/api';
import { useToast } from '../components/Toast';

export default function Settings() {
  const user = useAuth((s) => s.user);
  const setAuth = useAuth((s) => s.setAuth);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const toast = useToast((s) => s.push);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as { phone?: string })?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  if (!user) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ name, phone });
      setAuth(updated, useAuth.getState().token!);
      toast('Profile updated', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not save';
      toast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast('New passwords do not match', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast('Password changed. Use your new password next time you log in.', 'success');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not change password';
      toast(msg, 'error');
    } finally {
      setSavingPw(false);
    }
  }

  function onLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-1">Profile</h2>
          <p className="text-sm text-gray-500 mb-4">Your name and phone number as shown on orders and to vendors.</p>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={user.email} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">Email can't be changed yet — contact support if you need to update it.</p>
            </div>
            <button type="submit" disabled={savingProfile} className="bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
              {savingProfile ? <><span className="btn-spinner" /> Saving...</> : 'Save profile'}
            </button>
          </form>
        </section>

        {/* Password */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-1">Change password</h2>
          <p className="text-sm text-gray-500 mb-4">Pick something strong (8+ characters).</p>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input type="password" required value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input type="password" required minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input type="password" required minLength={8} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-600" />
            </div>
            <button type="submit" disabled={savingPw} className="bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
              {savingPw ? <><span className="btn-spinner" /> Updating...</> : 'Change password'}
            </button>
          </form>
        </section>

        {/* Account info */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-1">Account</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium capitalize">{user.role}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email verified</span><span className="font-medium">{user.emailVerified ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Wallet balance</span><span className="font-medium">₦{user.walletBalance.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Referral code</span><span className="font-mono text-xs">{user.referralCode}</span></div>
          </div>
        </section>

        {/* Logout */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <button onClick={onLogout} className="w-full text-red-600 font-semibold py-2 hover:bg-red-50 rounded-lg">
            Log out
          </button>
        </section>
      </main>
    </div>
  );
}