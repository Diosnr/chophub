import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI && MONGO_URI.startsWith('mongodb')) {
  import('mongoose').then(({ default: mongoose }) => {
    mongoose
      .connect(MONGO_URI)
      .then(() => console.log('MongoDB connected'))
      .catch((err: Error) => console.error('MongoDB connection failed:', err.message));
  });
} else {
  console.log('MONGO_URI not set — API running in health-only mode');
}

app.listen(PORT, () => {
  console.log(`ChopHub API listening on port ${PORT}`);
});
