import { Router } from 'express';
import { DeliveryZone } from '../models/DeliveryZone';
import { requireAuth, requireAnyRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const zones = await DeliveryZone.find({ active: true }).sort({ name: 1 });
    return res.json(zones);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

const adminRouter = Router();
adminRouter.use(requireAuth, requireAnyRole('admin', 'superadmin'));

adminRouter.get('/', async (_req, res) => {
  try {
    const zones = await DeliveryZone.find().sort({ name: 1 });
    return res.json(zones);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

adminRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, fee, estimatedDays, active } = req.body || {};
    if (!name || fee == null) {
      return res.status(400).json({ error: 'validation', message: 'name and fee required' });
    }
    const zone = await DeliveryZone.create({
      name: name.trim(),
      fee: Number(fee),
      estimatedDays: estimatedDays != null ? Number(estimatedDays) : undefined,
      active: active ?? true,
    });
    return res.status(201).json(zone);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('duplicate key')) {
      return res.status(409).json({ error: 'duplicate', message: 'Zone name already exists' });
    }
    return res.status(500).json({ error: 'server_error', message });
  }
});

adminRouter.put('/:id', async (req, res) => {
  try {
    const { name, fee, estimatedDays, active } = req.body || {};
    const update: Record<string, unknown> = {};
    if (name != null) update.name = String(name).trim();
    if (fee != null) update.fee = Number(fee);
    if (estimatedDays != null) update.estimatedDays = Number(estimatedDays);
    if (active != null) update.active = Boolean(active);
    const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!zone) return res.status(404).json({ error: 'not_found', message: 'Zone not found' });
    return res.json(zone);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

adminRouter.delete('/:id', async (req, res) => {
  try {
    await DeliveryZone.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

export default router;
export { adminRouter };