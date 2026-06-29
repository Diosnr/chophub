import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
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
app.use('/api/admin', adminRoutes);

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI && MONGO_URI.startsWith('mongodb')) {
  connectDB(MONGO_URI).catch((err) => console.error('DB connect error:', err.message));
} else {
  console.log('MONGO_URI not set — API running in health-only mode');
}

app.listen(PORT, () => {
  console.log(`ChopHub API listening on port ${PORT}`);
});
