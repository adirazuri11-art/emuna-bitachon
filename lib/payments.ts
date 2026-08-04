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
  amount: number; // בשקלים — מחושב בשרת בלבד
  customer: CheckoutCustomer;
  successUrl: string;
  failureUrl: string;
  webhookUrl: string;
  productName?: string;
}

export interface PaymentSession {
  redirectUrl: string; // עמוד התשלום המאובטח
  providerRef: string; // LowProfileId אצל הספק
}

export interface PaymentProvider {
  name: string;
  createPaymentPage(payload: CheckoutPayload): Promise<PaymentSession>;
}

// האם הסליקה מוגדרת ומופעלת (לא מחייבים אמיתי עד ש-CARDCOM_LIVE=true).
export function isPaymentConfigured(): boolean {
  return !!(process.env.CARDCOM_TERMINAL && process.env.CARDCOM_API_NAME);
}
export function isPaymentLive(): boolean {
  return isPaymentConfigured() && process.env.CARDCOM_LIVE === 'true';
}

/** Cardcom — LowProfile v11 (עמוד תשלום מתארח, PCI בצד קארדקום) */
export const cardcom: PaymentProvider = {
  name: 'cardcom',
  async createPaymentPage(payload) {
    const terminal = process.env.CARDCOM_TERMINAL;
    const apiName = process.env.CARDCOM_API_NAME;
    if (!terminal || !apiName) {
      throw new Error('סליקה לא מוגדרת: CARDCOM_TERMINAL / CARDCOM_API_NAME חסרים');
    }

    // amount מגיע מחושב בשרת בלבד — אף פעם לא מה-Client.
    const body = {
      TerminalNumber: Number(terminal),
      ApiName: apiName,
      Amount: Number(payload.amount.toFixed(2)),
      ReturnValue: payload.orderNumber, // מוחזר ב-webhook לזיהוי ההזמנה
      Operation: 'ChargeOnly',
      Language: 'he',
      ISOCoinId: 1, // ILS
      ProductName: payload.productName ?? `הזמנה ${payload.orderNumber}`,
      SuccessRedirectUrl: payload.successUrl,
      FailedRedirectUrl: payload.failureUrl,
      WebHookUrl: payload.webhookUrl,
    };

    let res: Response;
    try {
      res = await fetch('https://secure.cardcom.solutions/api/v11/LowProfile/Create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
    } catch {
      throw new Error('שגיאת תקשורת מול קארדקום');
    }
    const data = (await res.json()) as { ResponseCode?: number; Description?: string; Url?: string; LowProfileId?: string };
    if (data.ResponseCode !== 0 || !data.Url) {
      const debug = process.env.CARDCOM_DEBUG === 'true' ? ` :: ${JSON.stringify(data)} :: terminal=${terminal} apiName.len=${apiName.length}` : '';
      throw new Error(`קארדקום דחתה את הבקשה: ${data.Description ?? 'שגיאה לא ידועה'} (code ${data.ResponseCode})${debug}`);
    }
    return { redirectUrl: data.Url, providerRef: String(data.LowProfileId ?? '') };
  },
};

export function getPaymentProvider(): PaymentProvider {
  return cardcom;
}

export interface VerifiedTransaction {
  ok: boolean;
  orderNumber: string;
  amount: number;
  transactionId: string;
}

// אימות רשמי מול קארדקום — GetLpResult. מקור האמת היחיד לתשלום מוצלח.
// לא סומכים על ה-webhook/redirect params; שולפים ישירות מהספק לפי LowProfileId.
export async function verifyCardcomTransaction(lowProfileId: string): Promise<VerifiedTransaction | null> {
  const terminal = process.env.CARDCOM_TERMINAL;
  const apiName = process.env.CARDCOM_API_NAME;
  if (!terminal || !apiName || !lowProfileId) return null;
  try {
    const res = await fetch('https://secure.cardcom.solutions/api/v11/LowProfile/GetLpResult', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ TerminalNumber: Number(terminal), ApiName: apiName, LowProfileId: lowProfileId }),
      cache: 'no-store',
    });
    const d = (await res.json()) as {
      ResponseCode?: number;
      ReturnValue?: string;
      TranzactionInfo?: { Amount?: number; TranzactionId?: number; ResponseCode?: number };
    };
    const txOk = d.ResponseCode === 0 && (d.TranzactionInfo?.ResponseCode ?? 1) === 0;
    return {
      ok: txOk,
      orderNumber: String(d.ReturnValue ?? ''),
      amount: Number(d.TranzactionInfo?.Amount ?? 0),
      transactionId: String(d.TranzactionInfo?.TranzactionId ?? ''),
    };
  } catch {
    return null;
  }
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
