import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verifyCode, resendCode } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const setAuth = useAuth((s) => s.setAuth);
  const setPendingVerification = useAuth((s) => s.setPendingVerification);
  const pendingEmail = useAuth((s) => s.pendingVerificationEmail);

  const email = user?.email || pendingEmail || '';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function setDigit(i: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < 5) {
      inputs.current[i + 1]?.focus();
    }
    if (next.every((d) => d.length === 1)) {
      submit(next.join(''));
    }
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      const next = text.split('');
      setDigits(next);
      inputs.current[5]?.focus();
      submit(text);
    }
  }

  async function submit(code: string) {
    if (loading || !email) return;
    setLoading(true);
    setError('');
    try {
      const { user: updated, alreadyVerified } = await verifyCode({ email, code });
      if (updated && token) {
        setAuth({ ...updated, emailVerified: alreadyVerified ? true : true }, token);
      } else if (updated) {
        setAuth(updated, token || '');
      }
      setPendingVerification(null);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } }).response?.data;
      setError(data?.message || 'Incorrect code. Try again.');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (!email || resending || resendCooldown > 0) return;
    setResending(true);
    setInfo('');
    setError('');
    try {
      await resendCode(email);
      setInfo('New code sent. Check your inbox.');
      setResendCooldown(60);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not resend code';
      setError(message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Verify your email</h1>
        <p className="text-gray-600 mb-8">
          We sent a 6-digit code to <strong className="text-gray-900">{email}</strong>. Enter it below to activate your account.
        </p>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {info && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{info}</div>}

        <div className="flex gap-2 justify-between mb-6" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              disabled={loading}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-brand-600 disabled:opacity-50"
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          onClick={() => submit(digits.join(''))}
          disabled={loading || digits.some((d) => !d)}
          className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify email'}
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          Didn't get the code?{' '}
          <button
            onClick={onResend}
            disabled={resending || resendCooldown > 0}
            className="text-brand-600 font-semibold hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Wrong email?{' '}
          <button onClick={() => { setPendingVerification(null); navigate('/signup'); }} className="text-brand-600 font-semibold hover:underline">
            Sign up again
          </button>
        </div>
      </div>
    </div>
  );
}