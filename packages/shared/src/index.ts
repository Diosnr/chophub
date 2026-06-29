// Shared types between apps/web and apps/api

export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
}

export type ProductCategory = 'live-catfish' | 'frozen-chicken' | 'cooked-food' | 'other';
export type PricingType = 'fixed' | 'per-kg' | 'per-unit';

export interface Product {
  _id: string;
  vendorId: string;
  name: string;
  description?: string;
  images: string[];
  category: ProductCategory;
  pricingType: PricingType;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'monnify' | 'wallet';

export interface OrderItem {
  productId: string;
  vendorId: string;
  qty: number;
  weightKg?: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  _id: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryAddress: string;
  monnifyReference?: string;
  couponCode?: string;
  createdAt: string;
}

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  _id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  createdBy: string;
}

export interface Vendor {
  _id: string;
  userId: string;
  businessName: string;
  description?: string;
  logo?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
}
