import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppliedCoupon } from '@/lib/coupons';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  minQty?: number; // מינימום יחידות (כיפות זולות: 5)
  size?: string; // מידת וריאנט (כיפות) — נשמרת דרך כל התהליך
  sku?: string; // קוד ספק של הווריאנט הנבחר
  customization?: Record<string, string>; // { text: "לחתן היקר", font: "..." }
}

export interface GiftWrapState {
  selected: boolean;
  message: string;
}

const EMPTY_GIFT_WRAP: GiftWrapState = { selected: false, message: '' };

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  giftWrap: GiftWrapState;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  setGiftWrap: (patch: Partial<GiftWrapState>) => void;
  clearGiftWrap: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      giftWrap: EMPTY_GIFT_WRAP,
      setCoupon: (coupon) => set({ coupon }),
      setGiftWrap: (patch) => set((s) => ({ giftWrap: { ...s.giftWrap, ...patch } })),
      clearGiftWrap: () => set({ giftWrap: EMPTY_GIFT_WRAP }),
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
      removeItem: (id) =>
        set((s) => {
          const items = s.items.filter((i) => i.id !== id);
          // סל ריק לגמרי → הסרת אריזת המתנה והברכה
          return items.length ? { items } : { items, giftWrap: EMPTY_GIFT_WRAP };
        }),
      setQuantity: (id, quantity) =>
        set((s) => {
          const it = s.items.find((i) => i.id === id);
          const min = it?.minQty ?? 1;
          if (quantity < min) {
            // מתחת למינימום: אם יש מינימום כמותי — נצמד אליו; אחרת מסירים
            if (min > 1) return { items: s.items.map((i) => (i.id === id ? { ...i, quantity: min } : i)) };
            const items = s.items.filter((i) => i.id !== id);
            return items.length ? { items } : { items, giftWrap: EMPTY_GIFT_WRAP };
          }
          return { items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)) };
        }),
      clear: () => set({ items: [], coupon: null, giftWrap: EMPTY_GIFT_WRAP }),
    }),
    { name: 'emuna-bitachon-cart' }
  )
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
