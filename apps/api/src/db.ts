import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('MongoDB connection failed:', message);
    throw err;
  }
}
