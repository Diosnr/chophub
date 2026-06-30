import { Router } from 'express';
import { Vendor } from '../models/Vendor';
import { User } from '../models/User';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { sendMail } from '../services/zepto';

const router = Router();

const VENDOR_APPROVED_GUIDE = `
  <h2 style="color: #ea580c; margin: 0 0 16px;">You're approved! 🎉</h2>
  <p>Welcome to ChopHub. Below are five things top vendors on ChopHub do in their first week to make the most of the platform.</p>

  <h3 style="margin-top: 24px;">1. Add clear photos to every product</h3>
  <p>Products with real photos sell 3x more than text-only listings. Take photos in daylight, on a plain background, and show the product at the size customers will actually receive (e.g. the catfish next to a 1kg rice bag).</p>

  <h3 style="margin-top: 24px;">2. List at least 5 products in your first week</h3>
  <p>Vendors with more than 5 products get noticeably more browse views. If you sell catfish, also list your popular cuts and weights (1kg, 2kg, 5kg) as separate products — customers search by weight, not by "catfish".</p>

  <h3 style="margin-top: 24px;">3. Set prices that include the truth</h3>
  <p>If your catfish costs ₦3,500/kg and you offer free delivery within Ado-Ekiti, say ₦3,500 flat. If delivery costs extra, list the price of the fish only and let customers pick a delivery zone at checkout. Surprise fees are the #1 reason customers cancel.</p>

  <h3 style="margin-top: 24px;">4. Reply to order updates within 2 hours</h3>
  <p>When a customer places an order, you'll see it in your vendor dashboard. Update the order status (accepted → ready → dispatched → delivered) as soon as you can. Customers can see your response time, and the platform ranks faster vendors higher in search.</p>

  <h3 style="margin-top: 24px;">5. Get your first 5 customers to refer a friend</h3>
  <p>Your vendor dashboard has a referral code. Share it with your first customers — they get ₦500 off their first order, and you get ₦500 credited to your wallet for every new customer who signs up using your code and completes a purchase. Top vendors do this in their WhatsApp status.</p>

  <p style="margin-top: 24px;">Your vendor dashboard is live at <a href="https://chophub-api.onrender.com/vendor">chophub-api.onrender.com/vendor</a>. Log in and start listing.</p>
  <p>If anything goes wrong — wrong price, customer complaint, payment issue — reply to this email and a human will help.</p>
  <p>— The ChopHub team</p>
`;

const VENDOR_REJECTED_TEMPLATE = (reason?: string) => `
  <h2 style="color: #ea580c; margin: 0 0 16px;">Update on your ChopHub vendor application</h2>
  <p>Thanks for applying to sell on ChopHub. Unfortunately we can't approve your application${reason ? ` at this time. Reason from our team: <em>${reason}</em>` : ' right now'}.</p>
  <p>The most common reasons applications are declined are: incomplete business description, a business name that doesn't match what's being sold, or no clear location info. None of these are permanent — most vendors who reapply with a clearer listing are approved within a week.</p>
  <p>You can submit a new application any time from your account. We'd love to have you when you're ready.</p>
  <p>— The ChopHub team</p>
`;

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
    // NOTE: role stays 'customer' until admin approval (fixed gap)
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
    // Promote user to vendor role on approval
    await User.findByIdAndUpdate(vendor.userId, { role: 'vendor' });
    // Send approval email with success guide (don't block response)
    const user = await User.findById(vendor.userId);
    if (user) {
      sendMail({
        to: user.email,
        toName: user.name,
        subject: `Welcome to ChopHub, ${vendor.businessName}! 🎉`,
        htmlBody: `<div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">${VENDOR_APPROVED_GUIDE}</div>`,
        textBody: `Welcome to ChopHub, ${vendor.businessName}! Your vendor application has been approved. Log in to start listing products: https://chophub-api.onrender.com/vendor`,
      }).catch((err) => console.error('approval email failed:', err.message));
    }
    return res.json(vendor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.post('/:id/reject', requireAuth, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body || {};
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!vendor) {
      return res.status(404).json({ error: 'not_found', message: 'Vendor not found' });
    }
    // Send rejection email
    const user = await User.findById(vendor.userId);
    if (user) {
      sendMail({
        to: user.email,
        toName: user.name,
        subject: `Update on your ChopHub vendor application`,
        htmlBody: `<div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">${VENDOR_REJECTED_TEMPLATE(reason)}</div>`,
        textBody: `Hi ${user.name}, thanks for applying to ChopHub. Unfortunately your application wasn't approved${reason ? `: ${reason}` : ''}. You can reapply any time.`,
      }).catch((err) => console.error('rejection email failed:', err.message));
    }
    return res.json(vendor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'server_error', message });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: "not_found", message: "No vendor application found" });
    }
    return res.json(vendor);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "server_error", message });
  }
});

export default router;