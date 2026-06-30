import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, generateReferralCode, generateVerificationCode } from '../models/User';
import { sendMail, verificationEmail, welcomeEmail, zeptoConfigured } from '../services/zepto';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

async function sendVerification(email: string, name: string, code: string): Promise<void> {
  const mail = verificationEmail({ name, code });
  mail.to = email;
  await sendMail(mail);
}

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, phone, referredBy } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'validation', message: 'email, password, name are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'email_taken', message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = generateReferralCode();
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      phone,
      referralCode,
      referredBy,
      walletBalance: 0,
      role: 'customer',
      emailVerified: false,
      verificationCode,
      verificationCodeExpiresAt,
    });

    if (zeptoConfigured()) {
      try {
        await sendVerification(user.email, user.name, verificationCode);
      } catch (err) {
        console.error('[signup] failed to send verification email:', err);
      }
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });
    return res.status(201).json({
      token,
      requiresVerification: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        emailVerified: false,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'validation', message: 'email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password' });
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password' });
    }
    const token = signToken({ sub: user._id.toString(), role: user.role });
    return res.json({
      token,
      requiresVerification: !user.emailVerified,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ error: 'validation', message: 'email and code required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: 'Account not found' });
    }
    if (user.emailVerified) {
      return res.json({
        alreadyVerified: true,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          emailVerified: true,
          walletBalance: user.walletBalance,
          referralCode: user.referralCode,
        },
      });
    }
    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return res.status(400).json({ error: 'no_code', message: 'No verification code. Request a new one.' });
    }
    if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'code_expired', message: 'Verification code expired. Request a new one.' });
    }
    if (user.verificationCode !== code.trim()) {
      return res.status(400).json({ error: 'code_invalid', message: 'Incorrect verification code' });
    }
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    if (zeptoConfigured()) {
      try {
        const mail = welcomeEmail({ name: user.name, referralCode: user.referralCode });
        mail.to = user.email;
        await sendMail(mail);
      } catch (err) {
        console.error('[verify] failed to send welcome email:', err);
      }
    }

    return res.json({
      verified: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        emailVerified: true,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'validation', message: 'email required' });
    }
    if (!zeptoConfigured()) {
      return res.status(503).json({ error: 'email_disabled', message: 'Email service not configured' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: 'Account not found' });
    }
    if (user.emailVerified) {
      return res.json({ alreadyVerified: true });
    }
    const code = generateVerificationCode();
    user.verificationCode = code;
    user.verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendVerification(user.email, user.name, code);
    return res.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing token' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'unauthorized', message: 'User not found' });
    }
    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
      walletBalance: user.walletBalance,
      referralCode: user.referralCode,
    });
  } catch {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
  }
});

// Update profile (name, phone)
router.patch('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing token' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
    const { name, phone } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'validation', message: 'Name must be at least 2 characters' });
    }
    const user = await User.findByIdAndUpdate(
      payload.sub,
      { name: name.trim(), phone: typeof phone === 'string' ? phone.trim() : undefined },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: 'User not found' });
    }
    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
      walletBalance: user.walletBalance,
      referralCode: user.referralCode,
    });
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing token' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'validation', message: 'Current and new password required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'validation', message: 'New password must be at least 8 characters' });
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: 'User not found' });
    }
    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      return res.status(401).json({ error: 'wrong_password', message: 'Current password is incorrect' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
  }
});

export default router;