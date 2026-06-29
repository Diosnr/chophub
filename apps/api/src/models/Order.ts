import mongoose, { Schema, Document } from 'mongoose';

export interface OrderItem {
  productId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  weightKg?: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDocument extends Document {
    customerId: mongoose.Types.ObjectId;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    deliveryZone?: string;
    couponDiscount: number;
    total: number;
    paymentMethod: 'monnify' | 'wallet';
    paymentStatus: 'pending' | 'paid' | 'failed';
    orderStatus: 'pending' | 'accepted' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
    deliveryAddress: string;
    monnifyReference?: string;
    couponCode?: string;
    createdAt: Date;
    updatedAt: Date;
  }

const orderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    weightKg: { type: Number },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
          deliveryZone: { type: String },
          couponDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['monnify', 'wallet'], default: 'monnify' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'accepted', 'ready', 'dispatched', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    deliveryAddress: { type: String, required: true },
    monnifyReference: { type: String },
    couponCode: { type: String },
  },
  { timestamps: true }
);

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);
