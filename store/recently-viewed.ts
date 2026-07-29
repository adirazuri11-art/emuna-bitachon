import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentlyViewedState {
  slugs: string[];
  add: (slug: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      slugs: [],
      add: (slug) =>
        set((s) => ({
          slugs: [slug, ...s.slugs.filter((x) => x !== slug)].slice(0, 8),
        })),
    }),
    { name: 'emuna-bitachon-recently-viewed' }
  )
);
