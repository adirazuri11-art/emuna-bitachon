export type ProductIconKey =
  | 'kiddush' // גביעים
  | 'candles' // פמוטים
  | 'tallit' // טליתות וציציות
  | 'mezuzah' // מזוזות וסת"ם
  | 'kippah'
  | 'textile' // מטפחות, כיסויי חלה
  | 'gift';

export interface ProductCardData {
  id: string;
  slug: string;
  titleHe: string;
  imageUrl?: string; // איור/תמונת מוצר; בהיעדרה מוצג אייקון placeholder
  category: string;
  material?: string;
  basePrice: number;
  discountPrice?: number;
  certification?: string; // גוף הכשרות / האישור ההלכתי
  isCustomizable: boolean;
  iconKey: ProductIconKey;
  isNew?: boolean;
  stockLeft?: number; // כשנמוך (≤3) — מוצג חיווי דחיפות מכירתי
  minOrderUnits?: number; // מינימום יחידות להזמנה (כיפות זולות: 5) — מוצג "מארז N יח'"
}
