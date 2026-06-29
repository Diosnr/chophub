import mongoose, { Schema, Document } from 'mongoose';

export interface WalletTransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  kind: 'credit' | 'debit';
  source: 'monnify_topup' | 'referral_reward' | 'order_payment';
  amount: number;
  balanceAfter: number;
  reference?: string;
  orderId?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<WalletTransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['credit', 'debit'], required: true },
    source: { type: String, enum: ['monnify_topup', 'referral_reward', 'order_payment'], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    description: { type: String },
  },
  { timestamps: true }
);

export const WalletTransaction = mongoose.model<WalletTransactionDocument>('WalletTransaction', walletTransactionSchema);
