import { Router } from 'express';
import { User } from '../models/User';
import { WalletTransaction } from '../models/WalletTransaction';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { initializeTransaction, monnifyConfigured } from '../services/monnify';
import { creditWallet } from '../services/wallet';

const router = Router();

router.get('/balance', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'not_found' });
    return res.json({ balance: user.walletBalance });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get('/transactions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    return res.json(transactions);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/topup/init', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!monnifyConfigured()) {
      return res.status(503).json({ error: 'monnify_not_configured', message: 'Monnify keys not set on the server' });
    }
    const { amount } = req.body || {};
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'validation', message: 'amount must be at least ₦100' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'not_found' });

    const reference = `WALLET-${user._id}-${Date.now()}`;
    const webUrl = process.env.WEB_URL || 'http://localhost:5173';

    const { checkoutUrl } = await initializeTransaction({
      amount,
      customerEmail: user.email,
      customerName: user.name,
      paymentReference: reference,
      paymentDescription: 'ChopHub wallet top-up',
      redirectUrl: `${webUrl}/wallet?ref=${reference}`,
    });

    return res.json({ checkoutUrl, paymentReference: reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/topup/webhook', async (req, res) => {
  const signature = (req.headers['monnify-signature'] as string) || '';
  const rawBody = JSON.stringify(req.body);
  const { verifyWebhookSignature } = await import('../services/monnify');
  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'invalid_signature' });
  }
  const event = req.body as { eventType?: string; eventData?: { paymentReference?: string; amountPaid?: number } };
  const ref = event.eventData?.paymentReference;
  const amount = event.eventData?.amountPaid;
  if (event.eventType === 'SUCCESSFUL_TRANSACTION' && ref && ref.startsWith('WALLET-') && amount) {
    const userId = ref.split('-')[1];
    await creditWallet({
      userId,
      amount,
      source: 'monnify_topup',
      reference: ref,
      description: 'Wallet top-up via Monnify',
    });
  }
  return res.json({ received: true });
});

export default router;
