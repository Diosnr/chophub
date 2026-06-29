import { Router } from 'express';
import { Vendor } from '../models/Vendor';
import { User } from '../models/User';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { businessName, description } = req.body || {};
    if (!businessName) {
      return res.status(400).json({ error: 'validation', message: 'businessName required' });
    }
    const existing = await Vendor.findOne({ userId: req.userId });
    if (existing) {
      return res.status(409).json({ error: 'already_applied', message: 'You already have a vendor application' });
    }
    const vendor = await Vendor.create({
      userId: req.userId,
      businessName,
      description,
      status: 'pending',
    });
    await User.findByIdAndUpdate(req.userId, { role: 'vendor' });
    return res.status(201).json(vendor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'approved' }).sort({ createdAt: -1 });
    return res.json(vendors);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'not_found', message: 'Vendor not found' });
    }
    return res.json(vendor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/:id/approve', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!vendor) {
      return res.status(404).json({ error: 'not_found', message: 'Vendor not found' });
    }
    return res.json(vendor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/:id/reject', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!vendor) {
      return res.status(404).json({ error: 'not_found', message: 'Vendor not found' });
    }
    return res.json(vendor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

export default router;
