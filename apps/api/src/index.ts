import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
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

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI && MONGO_URI.startsWith('mongodb')) {
  connectDB(MONGO_URI).catch((err) => console.error('DB connect error:', err.message));
} else {
  console.log('MONGO_URI not set — API running in health-only mode (auth endpoints will fail)');
}

app.listen(PORT, () => {
  console.log(`ChopHub API listening on port ${PORT}`);
});
