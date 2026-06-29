import mongoose, { Schema, Document } from 'mongoose';

export interface ProductDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  images: string[];
  category: 'live-catfish' | 'frozen-chicken' | 'cooked-food' | 'other';
  pricingType: 'fixed' | 'per-kg' | 'per-unit';
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    images: [{ type: String }],
    category: {
      type: String,
      enum: ['live-catfish', 'frozen-chicken', 'cooked-food', 'other'],
      required: true,
      index: true,
    },
    pricingType: { type: String, enum: ['fixed', 'per-kg', 'per-unit'], required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model<ProductDocument>('Product', productSchema);
