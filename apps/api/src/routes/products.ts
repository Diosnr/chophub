import { Router } from 'express';
import { Product } from '../models/Product';
import { Vendor } from '../models/Vendor';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, vendorId } = req.query;
    const filter: Record<string, unknown> = { status: 'active' };
    if (category) filter.category = category;
    if (vendorId) filter.vendorId = vendorId;
    const products = await Product.find(filter)
      .populate('vendorId', 'businessName')
      .sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendorId', 'businessName');
    if (!product) {
      return res.status(404).json({ error: 'not_found', message: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor || vendor.status !== 'approved') {
      return res.status(403).json({ error: 'not_vendor', message: 'You must be an approved vendor' });
    }
    const { name, description, images, category, pricingType, price, stock } = req.body || {};
    if (!name || !category || !pricingType || price == null) {
      return res.status(400).json({ error: 'validation', message: 'name, category, pricingType, price required' });
    }
    const product = await Product.create({
      vendorId: vendor._id,
      name,
      description,
      images: images || [],
      category,
      pricingType,
      price,
      stock: stock || 0,
      status: 'active',
    });
    return res.status(201).json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(403).json({ error: 'not_vendor', message: 'Vendor account required' });
    }
    const product = await Product.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!product) {
      return res.status(404).json({ error: 'not_found', message: 'Product not found' });
    }
    const allowed = ['name', 'description', 'images', 'category', 'pricingType', 'price', 'stock', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (product as unknown as Record<string, unknown>)[key] = req.body[key];
      }
    }
    await product.save();
    return res.json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(403).json({ error: 'not_vendor', message: 'Vendor account required' });
    }
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId: vendor._id });
    if (!product) {
      return res.status(404).json({ error: 'not_found', message: 'Product not found' });
    }
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get("/mine", requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: "not_found", message: "No vendor application found" });
    }
    const products = await Product.find({ vendorId: vendor._id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "server_error", message });
  }
});

export default router;
