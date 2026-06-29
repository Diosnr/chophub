import mongoose, { Schema, Document } from 'mongoose';

export interface DeliveryZoneDocument extends Document {
  name: string;
  fee: number;
  estimatedDays?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deliveryZoneSchema = new Schema<DeliveryZoneDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    fee: { type: Number, required: true, default: 0 },
    estimatedDays: { type: Number },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DeliveryZone = mongoose.model<DeliveryZoneDocument>('DeliveryZone', deliveryZoneSchema);