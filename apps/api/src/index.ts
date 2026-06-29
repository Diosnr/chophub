import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paymentsRoutes from './routes/payments';
import adminRoutes, { adminManagement } from './routes/admin';
import walletRoutes from './routes/wallet';
import deliveryZoneRoutes, { adminRouter as adminDeliveryZoneRoutes } from './routes/deliveryZones';
import { User } from './models/User';

dotenv.config();

const app = express();
const webDistPath = process.env.WEB_DIST_DIR || path.join(__dirname, '../../../web/dist');
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
// Webhook needs raw body for signature verification; capture before json middleware
app.use('/api/payments/monnify/webhook', express.json({
  verify: (req: import('express').Request, _res, buf) => {
    (req as import('express').Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'chophub-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminManagement);
app.use('/api/admin/delivery-zones', adminDeliveryZoneRoutes);
app.use('/api/wallet', walletRoutes);

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI && MONGO_URI.startsWith('mongodb')) {
  connectDB(MONGO_URI)
    .then(seedSuperadmin)
    .catch((err) => console.error('DB connect error:', err.message));
} else {
  console.log('MONGO_URI not set — API running in health-only mode');
}

async function seedSuperadmin(): Promise<void> {
  const email = (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  if (!email) return;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== 'superadmin') {
        existing.role = 'superadmin';
        await existing.save();
        console.log(`[seed] promoted ${email} to superadmin`);
      }
      return;
    }
    console.log(`[seed] SUPERADMIN_EMAIL (${email}) has no account yet. They need to sign up first — then will be promoted on next boot.`);
  } catch (err) {
    console.error('[seed] superadmin seed error:', err);
  }
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  next();
});
app.use(express.static(webDistPath));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ChopHub API listening on port ${PORT}`);
});
