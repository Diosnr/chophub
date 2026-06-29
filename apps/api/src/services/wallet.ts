import { Types } from 'mongoose';
import { User } from '../models/User';
import { WalletTransaction } from '../models/WalletTransaction';
import { Order } from '../models/Order';
import { Setting } from '../models/Setting';

export async function creditWallet(params: {
  userId: Types.ObjectId | string;
  amount: number;
  source: 'monnify_topup' | 'referral_reward';
  reference?: string;
  description?: string;
}): Promise<number> {
  const user = await User.findById(params.userId);
  if (!user) throw new Error('User not found');
  user.walletBalance += params.amount;
  await user.save();
  await WalletTransaction.create({
    userId: user._id,
    kind: 'credit',
    source: params.source,
    amount: params.amount,
    balanceAfter: user.walletBalance,
    reference: params.reference,
    description: params.description,
  });
  return user.walletBalance;
}

export async function debitWalletForOrder(params: {
  userId: Types.ObjectId | string;
  orderId: Types.ObjectId | string;
  amount: number;
}): Promise<number> {
  const user = await User.findById(params.userId);
  if (!user) throw new Error('User not found');
  if (user.walletBalance < params.amount) {
    throw new Error('Insufficient wallet balance');
  }
  user.walletBalance -= params.amount;
  await user.save();
  await WalletTransaction.create({
    userId: user._id,
    kind: 'debit',
    source: 'order_payment',
    amount: params.amount,
    balanceAfter: user.walletBalance,
    orderId: params.orderId,
    description: `Order ${params.orderId}`,
  });
  return user.walletBalance;
}

export async function applyReferralReward(customerId: Types.ObjectId | string, orderId: Types.ObjectId | string): Promise<void> {
  const customer = await User.findById(customerId);
  if (!customer || !customer.referredBy) return;

  const otherPaidOrders = await Order.countDocuments({
    customerId: customer._id,
    paymentStatus: 'paid',
    _id: { $ne: orderId },
  });
  if (otherPaidOrders > 0) return;

  const setting = await Setting.findOne({ key: 'referral_reward' });
  const reward = setting?.value ?? 0;
  if (reward <= 0) return;

  const referrer = await User.findOne({ referralCode: customer.referredBy.toUpperCase() });
  if (!referrer) return;

  await creditWallet({
    userId: customer._id,
    amount: reward,
    source: 'referral_reward',
    description: 'Welcome reward — you were referred by a friend',
  });
  await creditWallet({
    userId: referrer._id,
    amount: reward,
    source: 'referral_reward',
    description: `Referral reward — ${customer.name} made their first purchase`,
  });
}
