import { Router } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Setting } from '../models/Setting';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, deliveryAddress, couponCode, paymentMethod } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'validation', message: 'items required' });
    }
    if (!deliveryAddress) {
      return res.status(400).json({ error: 'validation', message: 'deliveryAddress required' });
    }

    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, status: 'active' });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems: Array<{
      productId: unknown;
      vendorId: unknown;
      name: string;
      qty: number;
      weightKg?: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ error: 'invalid_product', message: `Product ${item.productId} not available` });
      }
      const isPerKg = product.pricingType === 'per-kg';
      const qty = isPerKg ? 1 : item.qty;
      const weightKg = isPerKg ? item.weightKg : undefined;
      const lineTotal = isPerKg ? product.price * (weightKg || 0) : product.price * qty;
      subtotal += lineTotal;
      orderItems.push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        qty,
        weightKg,
        unitPrice: product.price,
        lineTotal,
      });
    }

    const deliverySetting = await Setting.findOne({ key: 'delivery_fee' });
    const deliveryFee = deliverySetting?.value ?? 0;

    let couponDiscount = 0;
    if (couponCode) {
      const { Coupon } = await import('../models/Coupon');
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && subtotal >= coupon.minOrder) {
        couponDiscount = coupon.type === 'percent' ? subtotal * (coupon.value / 100) : coupon.value;
      }
    }

    const total = subtotal + deliveryFee - couponDiscount;

    const order = await Order.create({
      customerId: req.userId,
      items: orderItems,
      subtotal,
      deliveryFee,
      couponDiscount,
      total,
      paymentMethod: paymentMethod || 'monnify',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      deliveryAddress,
      couponCode,
    });

    if (paymentMethod === 'wallet') {
      const { debitWalletForOrder, applyReferralReward } = await import('../services/wallet');
      try {
        await debitWalletForOrder({ userId: req.userId!, orderId: order._id, amount: total });
        order.paymentStatus = 'paid';
        order.orderStatus = 'accepted';
        await order.save();
        applyReferralReward(String(req.userId), String(order._id)).catch((err) =>
          console.error('referral reward error:', err.message)
        );
      } catch (walletErr) {
        await Order.findByIdAndDelete(order._id);
        const wmsg = walletErr instanceof Error ? walletErr.message : String(walletErr);
        return res.status(400).json({ error: 'wallet_payment_failed', message: wmsg });
      }
    }

    return res.status(201).json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const orders = await Order.find({ customerId: req.userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }
    if (order.customerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'forbidden', message: 'Not your order' });
    }
    return res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

// Vendor: list orders that include this vendor's items
router.get('/vendor/mine', requireAuth, requireRole('vendor'), async (req: AuthRequest, res) => {
  try {
    const { Vendor } = await import('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'not_found', message: 'Vendor not found' });
    }
    const orders = await Order.find({ 'items.vendorId': vendor._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

// Vendor or admin: update order status
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'validation', message: 'status required' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }
    // Allow admin to update anything; vendor can only update their items' order
    if (req.userRole !== 'admin') {
      const { Vendor } = await import('../models/Vendor');
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor || !order.items.some((i) => i.vendorId.toString() === vendor._id.toString())) {
        return res.status(403).json({ error: 'forbidden', message: 'Not your order' });
      }
    }
    order.orderStatus = status;
    await order.save();
    return res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

export default router;
