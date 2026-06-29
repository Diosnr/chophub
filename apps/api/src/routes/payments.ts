import { Router } from 'express';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { initializeTransaction, monnifyConfigured, verifyWebhookSignature } from '../services/monnify';

const router = Router();

router.post('/monnify/init/:orderId', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!monnifyConfigured()) {
      return res.status(503).json({ error: 'monnify_not_configured', message: 'Monnify keys not set on the server' });
    }
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'not_found', message: 'Order not found' });
    }
    if (order.customerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'forbidden', message: 'Not your order' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'already_paid', message: 'Order already paid' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: 'User not found' });
    }

    const paymentReference = `CHOPHUB-${order._id}-${Date.now()}`;
    const webUrl = process.env.WEB_URL || 'http://localhost:5173';

    const { checkoutUrl } = await initializeTransaction({
      amount: order.total,
      customerEmail: user.email,
      customerName: user.name,
      paymentReference,
      paymentDescription: `ChopHub order ${order._id}`,
      redirectUrl: `${webUrl}/orders?ref=${paymentReference}`,
    });

    order.monnifyReference = paymentReference;
    await order.save();

    return res.json({ checkoutUrl, paymentReference });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/monnify/webhook', async (req, res) => {
  const signature = (req.headers['monnify-signature'] as string) || '';
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'invalid_signature' });
  }

  const event = req.body as {
    eventType?: string;
    eventData?: { paymentReference?: string };
  };
  const eventType = event.eventType;
  const paymentReference = event.eventData?.paymentReference;

  if (paymentReference) {
    const order = await Order.findOne({ monnifyReference: paymentReference });
    if (order) {
      if (eventType === 'SUCCESSFUL_TRANSACTION') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'accepted';
      } else if (eventType === 'FAILED_TRANSACTION') {
        order.paymentStatus = 'failed';
      }
      await order.save();
    }
  }

  return res.json({ received: true });
});

router.get('/monnify/redirect', (_req, res) => {
  const webUrl = process.env.WEB_URL || 'http://localhost:5173';
  res.redirect(`${webUrl}/orders`);
});

export default router;
