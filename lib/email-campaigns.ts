// Email Campaigns Configuration
// תוכנית קמפיינים דוא"ל (NewsletterAPI + EmailJS)

export interface EmailCampaign {
  id: string;
  name: string;
  segment: 'all' | 'newsletter' | 'club' | 'abandoned_cart' | 'inactive' | 'vip';
  subject: string;
  description: string;
  sendTime?: Date;
  recurring?: 'weekly' | 'monthly' | 'quarterly';
}

export interface EmailTemplate {
  id: string;
  type: 'welcome' | 'cart_abandonment' | 'post_purchase' | 'newsletter' | 'vip_exclusive' | 'win_back' | 'holiday';
  subject: string;
  previewText: string;
  variables: string[]; // e.g., ['firstName', 'cartTotal', 'productName']
}

// Campaign 1: Welcome Email (Join Club)
export const WELCOME_EMAIL: EmailTemplate = {
  id: 'welcome-club',
  type: 'welcome',
  subject: 'הצטרפת למועדון אמונה וביטחון — קופון 10% ממתין לך! 🎁',
  previewText: 'קופון בלעדי לחברי המועדון בלבד',
  variables: ['firstName', 'email', 'couponCode', 'expiryDate'],
};

// Campaign 2: Cart Abandonment — 1 hour after cart abandonment
export const CART_ABANDONMENT_1H: EmailTemplate = {
  id: 'cart-abandon-1h',
  type: 'cart_abandonment',
  subject: 'שכחת משהו? 👀 {productName} עדיין בעגלה',
  previewText: 'שנרות הוא חזרו עם בעיה...',
  variables: ['firstName', 'cartTotal', 'productName', 'cartUrl', 'cartItems'],
};

// Campaign 3: Cart Abandonment — 24 hours with incentive
export const CART_ABANDONMENT_24H: EmailTemplate = {
  id: 'cart-abandon-24h',
  type: 'cart_abandonment',
  subject: 'הודעה אחרונה: {productName} עמוד את להסיר מהמלאי 🚨',
  previewText: 'מלאי מוגבל — נרותיים קופצים מהמדפים',
  variables: ['firstName', 'cartTotal', 'productName', 'cartUrl', 'urgencyMessage'],
};

// Campaign 4: Post-Purchase Follow-up (3 days)
export const POST_PURCHASE_FOLLOWUP: EmailTemplate = {
  id: 'post-purchase-3d',
  type: 'post_purchase',
  subject: 'קיבלת אותם? צילום + ביקורת = מתנה בהודעה הבאה 📸',
  previewText: 'כרטיס $5 לחברי המועדון שישלחו צילום של המוצר',
  variables: ['firstName', 'orderId', 'productName', 'reviewUrl', 'incentiveCredit'],
};

// Campaign 5: Newsletter — Weekly
export const WEEKLY_NEWSLETTER: EmailTemplate = {
  id: 'newsletter-weekly',
  type: 'newsletter',
  subject: 'שבוע זה בעמונה וביטחון: קולקציה חדשה + טיפים',
  previewText: 'מה שחדש לשבוע הזה בעמונה וביטחון',
  variables: ['weekNumber', 'newArrivals', 'holidayContext', 'tipOfTheWeek', 'exclusiveOffer'],
};

// Campaign 6: VIP Exclusive — Members-only sale
export const VIP_EXCLUSIVE_SALE: EmailTemplate = {
  id: 'vip-exclusive-sale',
  type: 'vip_exclusive',
  subject: '🏅 בחברי מועדון בלבד: 25% הנחה על קולקציית הכסף החדשה',
  previewText: '48 שעות בלבד — חברי מועדון קבלו גישה ראשונה',
  variables: ['firstName', 'saleStartDate', 'saleEndDate', 'exclusiveProducts', 'discountCode'],
};

// Campaign 7: Win-Back Campaign (inactive 60+ days)
export const WIN_BACK_CAMPAIGN: EmailTemplate = {
  id: 'win-back-60d',
  type: 'win_back',
  subject: 'חברנו {firstName} — יחזרו לעמונה עם 20% הנחה?',
  previewText: 'קניה אחת בלבד — ואז נבדוק',
  variables: ['firstName', 'lastPurchaseDate', 'discountCode', 'newProductsList', 'wishlistReminder'],
};

// Campaign 8: Holiday Campaigns (Passover, Hanukkah, etc.)
export const HOLIDAY_CAMPAIGNS = {
  passover: {
    id: 'holiday-passover',
    subject: 'הכנות לפסח: מארז הבדלה מעוצב {year}',
    description: 'Passover Haggadah sets, Seder plate customization',
  },
  hanukkah: {
    id: 'holiday-hanukkah',
    subject: 'חנוכה קרב: חנוכיות מעוצבות עם אישור כשרות מיוחד',
    description: 'Hanukkiot, candles, menorah customization for families',
  },
  rosh_hashanah: {
    id: 'holiday-rosh-hashanah',
    subject: 'ראש השנה: מתנות משפחה לראש השנה החדש {year}',
    description: 'High Holiday gifts, family packages',
  },
};

// Campaign Configuration: Automation Rules
export const CAMPAIGN_TRIGGERS = {
  WELCOME: {
    event: 'club_signup',
    delay: 0,
    template: WELCOME_EMAIL,
  },
  CART_ABANDON_1H: {
    event: 'cart_abandoned',
    delay: 60 * 60 * 1000, // 1 hour in ms
    template: CART_ABANDONMENT_1H,
  },
  CART_ABANDON_24H: {
    event: 'cart_abandoned',
    delay: 24 * 60 * 60 * 1000, // 24 hours
    template: CART_ABANDONMENT_24H,
    condition: 'cart_not_purchased', // Only send if not purchased in interim
  },
  POST_PURCHASE: {
    event: 'purchase_complete',
    delay: 3 * 24 * 60 * 60 * 1000, // 3 days
    template: POST_PURCHASE_FOLLOWUP,
  },
  WIN_BACK: {
    event: 'user_inactive',
    delay: 0,
    template: WIN_BACK_CAMPAIGN,
    condition: 'no_purchase_60_days', // Inactive 60+ days
  },
};

// Email Metrics to Track
export interface EmailMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number; // Purchases
  unsubscribed: number;
  complained: number;

  // Calculated
  openRate: number;
  clickRate: number;
  conversionRate: number;
  roi: number; // Revenue / Cost
}

// Helper: Calculate metrics
export function calculateEmailMetrics(data: Omit<EmailMetrics, 'openRate' | 'clickRate' | 'conversionRate' | 'roi'>): EmailMetrics {
  const openRate = data.opened / data.delivered;
  const clickRate = data.clicked / data.delivered;
  const conversionRate = data.converted / data.delivered;

  return {
    ...data,
    openRate,
    clickRate,
    conversionRate,
    roi: 0, // Will be calculated with revenue data
  };
}

// Industry Benchmarks (Hebrew e-commerce)
export const BENCHMARKS = {
  openRate: 0.25, // 25%
  clickRate: 0.05, // 5%
  conversionRate: 0.02, // 2%
  unsubscribeRate: 0.005, // 0.5%
};
