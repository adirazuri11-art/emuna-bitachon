// Member-Only Pricing System
// מחירים בלעדיים לחברי מועדון — 20% הנחה על מוצרים נבחרים (2 בקטגוריה)

export interface MemberPrice {
  productId: string;
  discountPercentage: number;
}

// 20% הנחה למוצרים נבחרים (2 מוצרים בקטגוריה)
export const MEMBER_ONLY_PRODUCTS: string[] = [
  'p1', // כוסות קידוש
  'p2', // כוסות קידוש (שני)
  'p3', // ציציות וטליתות
  'p4', // ציציות וטליתות (שני)
  'p5', // כיפות
  'p6', // כיפות (שני)
  'p7', // מטפחות מעוצבות
  'p8', // מטפחות מעוצבות (שני)
  'p9', // תשמישי קדושה לבית
  'p10', // תשמישי קדושה לבית (שני)
  'p11', // מזוזות
  'p12', // מזוזות (שני)
  'p13', // כיסויי חלה
  'p14', // כיסויי חלה (שני)
  'p15', // הבדלה
  'p16', // הבדלה (שני)
];

// Helper: Check if product has member discount
export function isMemberOnlyProduct(productId: string): boolean {
  return MEMBER_ONLY_PRODUCTS.includes(productId);
}

// Helper: Get member discount percentage
export function getMemberDiscount(): number {
  return 20; // 20% הנחה קבוע
}

// UI Strings
export const MEMBER_PRICING_COPY = {
  badge: '💎 הטבת חבר מועדון',
  tag: 'בלעדי למועדון',
  tooltip:
    'חברי מועדון אמונה וביטחון קבלים הנחה של 20% על מוצרים מובחרים',
  ctaButtonText: 'הצטרפו למועדון לקבלת הנחה זו',
  savingsBadge: (percent: number) =>
    `20% הנחה למועדון`,
  regularPriceLabel: 'מחיר רגיל',
  memberPriceLabel: 'מחיר חברים',
};

// Benefits Card Copy
export const MEMBER_BENEFITS_COPY = {
  title: '💎 חברות מועדון אמונה וביטחון',
  benefits: [
    '✅ 20% הנחה על מוצרים מובחרים',
    '✅ 15% הנחה לרשמה חדשה — לשבעה ימים',
    '✅ גישה ראשונה לקולקציות חדשות',
    '✅ עדכונים על מבצעי חגים בלעדיים',
    '✅ שירות VIP לשאלות מותאמות',
  ],
  joinCTA: 'הצטרפו עכשיו — בחינם!',
};
