import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'admin';
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
    walletBalance: { type: Number, default: 0 },
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export const User = mongoose.model<UserDocument>('User', userSchema);
