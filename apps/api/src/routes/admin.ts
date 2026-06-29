import { Router } from 'express';
import { Vendor } from '../models/Vendor';
import { Order } from '../models/Order';
import { Coupon } from '../models/Coupon';
import { Setting } from '../models/Setting';
import { User } from '../models/User';
import { requireAuth, requireAnyRole, requireSuperadmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireAnyRole('admin', 'superadmin'));

router.get('/vendors/pending', async (_req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'pending' }).populate('userId', 'email name');
    return res.json(vendors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/vendors', async (_req, res) => {
  try {
    const vendors = await Vendor.find().populate('userId', 'email name').sort({ createdAt: -1 });
    return res.json(vendors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/coupons', async (_req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.json(coupons);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/coupons', async (req: AuthRequest, res) => {
  try {
    const { code, type, value, minOrder, expiresAt, usageLimit } = req.body || {};
    if (!code || !type || value == null) {
      return res.status(400).json({ error: 'validation', message: 'code, type, value required' });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      minOrder: minOrder || 0,
      expiresAt,
      usageLimit,
      usedCount: 0,
      createdBy: req.userId,
    });
    return res.status(201).json(coupon);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/settings', async (_req, res) => {
  try {
    const settings = await Setting.find();
    return res.json(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.put('/settings/:key', async (req: AuthRequest, res) => {
  try {
    const { value } = req.body || {};
    if (value == null) {
      return res.status(400).json({ error: 'validation', message: 'value required' });
    }
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedBy: req.userId },
      { upsert: true, new: true }
    );
    return res.json(setting);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/orders', async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

const adminManagement = Router();
adminManagement.use(requireAuth, requireSuperadmin);

adminManagement.get('/admins', async (_req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('email name role emailVerified walletBalance createdAt')
      .sort({ createdAt: -1 });
    return res.json(admins);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

adminManagement.post('/admins/promote/:userId', async (req: AuthRequest, res) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) {
      return res.status(404).json({ error: 'not_found', message: 'User not found' });
    }
    if (target.role === 'superadmin') {
      return res.status(400).json({ error: 'already_superadmin', message: 'Cannot promote a superadmin' });
    }
    if (target.role === 'admin') {
      return res.json({ ok: true, alreadyAdmin: true, user: target });
    }
    target.role = 'admin';
    await target.save();
    return res.json({ ok: true, user: target });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

adminManagement.post('/admins/demote/:userId', async (req: AuthRequest, res) => {
  try {
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'self_demote', message: 'Superadmin cannot demote themselves' });
    }
    const target = await User.findById(req.params.userId);
    if (!target) {
      return res.status(404).json({ error: 'not_found', message: 'User not found' });
    }
    if (target.role === 'superadmin') {
      return res.status(400).json({ error: 'cannot_demote_superadmin', message: 'Cannot demote another superadmin' });
    }
    if (target.role !== 'admin') {
      return res.json({ ok: true, alreadyCustomer: true, user: target });
    }
    target.role = 'customer';
    await target.save();
    return res.json({ ok: true, user: target });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

adminManagement.get('/users/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) {
      return res.json([]);
    }
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      $or: [
        { email: new RegExp(safe, 'i') },
        { name: new RegExp(safe, 'i') },
      ],
    })
      .select('email name role emailVerified walletBalance')
      .limit(20);
    return res.json(users);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

export default router;
export { adminManagement };
