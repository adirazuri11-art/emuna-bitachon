import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppliedCoupon } from '@/lib/coupons';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  minQty?: number; // מינימום יחידות (כיפות זולות: 5)
  customization?: Record<string, string>; // { text: "לחתן היקר", font: "..." }
}

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: item.minQty ?? 1 }] };
        }),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((s) => {
          const it = s.items.find((i) => i.id === id);
          const min = it?.minQty ?? 1;
          if (quantity < min) {
            // מתחת למינימום: אם יש מינימום כמותי — נצמד אליו; אחרת מסירים
            if (min > 1) return { items: s.items.map((i) => (i.id === id ? { ...i, quantity: min } : i)) };
            return { items: s.items.filter((i) => i.id !== id) };
          }
          return { items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)) };
        }),
      clear: () => set({ items: [], coupon: null }),
    }),
    { name: 'emuna-bitachon-cart' }
  )
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
