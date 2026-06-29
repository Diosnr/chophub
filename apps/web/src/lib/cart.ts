import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PricingType = 'fixed' | 'per-kg' | 'per-unit';

export interface CartItem {
  productId: string;
  vendorId: string;
  name: string;
  vendorName: string;
  pricingType: PricingType;
  unitPrice: number;
  qty: number;
  weightKg?: number;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string) => void;
  update: (productId: string, patch: Partial<CartItem>) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      qty: i.qty + item.qty,
                      weightKg: (i.weightKg || 0) + (item.weightKg || 0),
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      update: (productId, patch) =>
        set((state) => ({
          items: state.items.map((i) => (i.productId === productId ? { ...i, ...patch } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'chophub-cart' }
  )
);
