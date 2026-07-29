export interface CustomizerState {
  text: string;
  date: string;
  dedication: string;
  eventType: string;
  fontId: string;
  colorId: string;
  positionId: string;
  symbolId: string | null;
  logoDataUrl: string | null;
  logoName: string | null;
  giftWrap: boolean;
  matchingBag: boolean;
  notes: string;
  quantity: number;
}

export const emptyCustomizerState = (
  defaults: { fontId: string; colorId: string; positionId: string }
): CustomizerState => ({
  text: '',
  date: '',
  dedication: '',
  eventType: '',
  fontId: defaults.fontId,
  colorId: defaults.colorId,
  positionId: defaults.positionId,
  symbolId: null,
  logoDataUrl: null,
  logoName: null,
  giftWrap: false,
  matchingBag: false,
  notes: '',
  quantity: 1,
});
