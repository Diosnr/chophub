import mongoose, { Schema, Document } from 'mongoose';

export interface CouponDocument extends Document {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<CouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    expiresAt: { type: Date },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<CouponDocument>('Coupon', couponSchema);
