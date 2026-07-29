import { create } from 'zustand';

interface UIState {
  isCartOpen: boolean;
  isAssistantOpen: boolean;
  assistantPrefill: string | null; // שאילתה מסרגל החיפוש שנפתחת ישר ביועץ
  openCart: () => void;
  closeCart: () => void;
  openAssistant: (prefill?: string) => void;
  closeAssistant: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  isAssistantOpen: false,
  assistantPrefill: null,
  openCart: () => set({ isCartOpen: true, isAssistantOpen: false }),
  closeCart: () => set({ isCartOpen: false }),
  openAssistant: (prefill) =>
    set({ isAssistantOpen: true, isCartOpen: false, assistantPrefill: prefill ?? null }),
  closeAssistant: () => set({ isAssistantOpen: false, assistantPrefill: null }),
}));
