import { Router } from 'express';
import { Vendor } from '../models/Vendor';
import { Order } from '../models/Order';
import { Coupon } from '../models/Coupon';
import { Setting } from '../models/Setting';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('admin'));

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

export default router;
