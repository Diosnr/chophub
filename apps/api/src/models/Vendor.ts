import mongoose, { Schema, Document } from 'mongoose';

export interface VendorDocument extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  description?: string;
  logo?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<VendorDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    description: { type: String },
    logo: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model<VendorDocument>('Vendor', vendorSchema);
