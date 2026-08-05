// ============================================================
// מיפוי קטגוריות האתר → Google Product Category (taxonomy IDs רשמיים).
// משמש אך ורק את פיד ה-Merchant Center — אינו משנה את קטגוריות האתר.
// מקור: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
//
// עקרון: ברירת מחדל שמרנית ומדויקת — "Religious Items" (96) מכסה יודאיקה
// כללית ומונע הפעלת דרישות Apparel המחמירות (age_group/gender/size/GTIN).
// חריגים ברורים בלבד: תכשיטים (188), ספרים (784).
// ============================================================

export interface GoogleCategoryInfo {
  id: number;
  path: string;
}

const RELIGIOUS_ITEMS: GoogleCategoryInfo = { id: 96, path: 'Religious Items' };

// מפתח = שם הקטגוריה בעברית כפי שמופיע ב-CatalogProduct.category (CAT_NAME).
export const GOOGLE_CATEGORY_BY_HE: Record<string, GoogleCategoryInfo> = {
  'תשמישי קדושה לבית': RELIGIOUS_ITEMS,
  מזוזות: RELIGIOUS_ITEMS,
  'כיסויי חלה': RELIGIOUS_ITEMS,
  הבדלה: RELIGIOUS_ITEMS,
  'נטלות ומים אחרונים': RELIGIOUS_ITEMS,
  ברכות: RELIGIOUS_ITEMS,
  'כוסות קידוש': RELIGIOUS_ITEMS,
  פמוטים: RELIGIOUS_ITEMS,
  'ציציות וטליתות': RELIGIOUS_ITEMS,
  כיפות: RELIGIOUS_ITEMS,
  'מטפחות מעוצבות': RELIGIOUS_ITEMS,
  'מתנות ואירועים': RELIGIOUS_ITEMS,
  'תכשיטי יודאיקה': { id: 188, path: 'Apparel & Accessories > Jewelry' },
  'אמנות ועיצוב יהודי': RELIGIOUS_ITEMS,
  'ספרים וסידורים': { id: 784, path: 'Media > Books' },
  'חגים ומועדים': RELIGIOUS_ITEMS,
  'מוצרים לילדים': RELIGIOUS_ITEMS,
  'ברית ולידה': RELIGIOUS_ITEMS,
  'מזכרות מירושלים': RELIGIOUS_ITEMS,
};

// ברירת מחדל בטוחה לכל קטגוריה שאינה במפה (יודאיקה כללית).
export const DEFAULT_GOOGLE_CATEGORY = RELIGIOUS_ITEMS;

export function googleCategoryForHe(categoryHe: string): GoogleCategoryInfo {
  return GOOGLE_CATEGORY_BY_HE[categoryHe] ?? DEFAULT_GOOGLE_CATEGORY;
}

// g:product_type — היררכיית הקטגוריות שלנו (טקסט חופשי, לשליטתנו).
export function productTypeFor(categoryHe: string, subcategory?: string): string {
  return ['יודאיקה', categoryHe, subcategory].filter(Boolean).join(' > ');
}
