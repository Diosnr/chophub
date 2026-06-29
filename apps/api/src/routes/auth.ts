import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, generateReferralCode } from '../models/User';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
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
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      phone,
      referralCode,
      referredBy,
      walletBalance: 0,
      role: 'customer',
    });
    const token = signToken({ sub: user._id.toString(), role: user.role });
    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
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
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
      },
    });
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
      walletBalance: user.walletBalance,
      referralCode: user.referralCode,
    });
  } catch {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
  }
});

export default router;
