// ============================================================
// אבסטרקציית סליקה לשוק הישראלי
//
// זרימת הרכישה המלאה:
// 1. /checkout — הלקוח ממלא פרטים
// 2. Server Action יוצר Order ב-Prisma (status: PENDING)
// 3. getPaymentProvider().createPaymentPage() → redirectUrl
// 4. הלקוח משלם בעמוד המאובטח של הספק (PCI בצד שלהם)
// 5. הספק קורא ל-webhook  /api/webhooks/payment →
//    paymentStatus=PAID, OrderStatus=CONFIRMED, אירוע purchase לאנליטיקס
//
// ספקים ישראליים מומלצים: Cardcom (LowProfile API), PayPlus, Grow (משולם).
// ============================================================

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutPayload {
  orderNumber: string;
  amount: number; // בשקלים
  customer: CheckoutCustomer;
  successUrl: string;
  failureUrl: string;
}

export interface PaymentSession {
  redirectUrl: string; // עמוד התשלום המאובטח
  providerRef: string; // מזהה העסקה אצל הספק
}

export interface PaymentProvider {
  name: string;
  createPaymentPage(payload: CheckoutPayload): Promise<PaymentSession>;
}

/** Cardcom — LowProfile API (עמוד תשלום מתארח) */
export const cardcom: PaymentProvider = {
  name: 'cardcom',
  async createPaymentPage(payload) {
    const terminal = process.env.CARDCOM_TERMINAL;
    const apiName = process.env.CARDCOM_API_NAME;
    if (!terminal || !apiName) {
      throw new Error(
        'סליקה לא מוגדרת: יש למלא CARDCOM_TERMINAL ו-CARDCOM_API_NAME ב-.env'
      );
    }

    // TODO: קריאה אמיתית ל-https://secure.cardcom.solutions/api/v11/LowProfile/Create
    // עם payload.amount, payload.orderNumber, successUrl/failureUrl,
    // ושמירת LowProfileId כ-providerRef על ההזמנה.
    throw new Error('Cardcom integration not implemented yet');
  },
};

export function getPaymentProvider(): PaymentProvider {
  return cardcom;
}

export const FREE_SHIPPING_THRESHOLD = 399;
export const STANDARD_SHIPPING_COST = 29;

export function calcShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
}

// ---- קופונים ----
// קופון השקה לדוגמה — ניהול קופונים מלא יחובר עם ה-DB.
export interface Coupon {
  code: string;
  pct: number;
  label: string;
}

const COUPONS: Coupon[] = [{ code: 'ברוכים10', pct: 10, label: 'הנחת הצטרפות 10%' }];

export function validateCoupon(code: string): Coupon | null {
  const clean = code.trim();
  return COUPONS.find((c) => c.code === clean) ?? null;
}
