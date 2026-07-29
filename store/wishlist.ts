import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  slugs: string[];
  toggle: (slug: string) => boolean; // מחזיר true אם נוסף
  has: (slug: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => {
        const exists = get().slugs.includes(slug);
        set((s) => ({
          slugs: exists ? s.slugs.filter((x) => x !== slug) : [...s.slugs, slug],
        }));
        return !exists;
      },
      has: (slug) => get().slugs.includes(slug),
    }),
    { name: 'emuna-bitachon-wishlist' }
  )
);
