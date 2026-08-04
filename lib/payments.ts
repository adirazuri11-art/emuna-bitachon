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

export interface DocumentLine {
  description: string;
  unitCost: number; // מחיר ליחידה בש"ח
  quantity: number;
}

export interface CheckoutPayload {
  orderNumber: string;
  amount: number; // בשקלים — מחושב בשרת בלבד
  customer: CheckoutCustomer;
  successUrl: string;
  failureUrl: string;
  webhookUrl: string;
  productName?: string;
  documentLines?: DocumentLine[]; // שורות לקבלה — סכומן חייב להיות שווה ל-amount
}

// האם להפיק קבלה אוטומטית דרך Cardcom (מודול "הפקת מסמכים").
// כבוי כברירת מחדל — הפעלה רק אחרי אימות שהמודול פעיל בחשבון, אחרת התשלומים נשברים.
export function isInvoiceEnabled(): boolean {
  return process.env.CARDCOM_INVOICE === 'true';
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
    const body: Record<string, unknown> = {
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

    // הפקת קבלה אוטומטית — רק אם המודול הופעל במפורש (CARDCOM_INVOICE=true).
    // Cardcom מפיק את המסמך לפי הגדרת החשבון (עוסק פטור → קבלה) ושולח במייל ללקוח.
    if (isInvoiceEnabled() && payload.documentLines && payload.documentLines.length > 0) {
      body.Operation = 'ChargeAndCreateDocument';
      body.Document = {
        Name: payload.customer.name || 'לקוח',
        Email: payload.customer.email || undefined,
        Phone: payload.customer.phone || undefined,
        IsSendByEmail: !!payload.customer.email, // שליחת הקבלה במייל ללקוח
        Products: payload.documentLines.map((l) => ({
          Description: l.description.slice(0, 250),
          UnitCost: Number(l.unitCost.toFixed(2)),
          Quantity: l.quantity,
        })),
      };
    }

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

// הפקת קבלה (Receipt) רטרואקטיבית להזמנה ששולמה, מקושרת לעסקת האשראי הקיימת.
// עוסק פטור → IsVatFree=true. הקישור דרך DealNumbers מונע כפילות הכנסה בספרים.
export interface ReceiptResult {
  ok: boolean;
  documentNumber?: number | string;
  documentType?: string;
  description?: string;
  raw?: unknown;
}
export async function createReceiptForTransaction(params: {
  transactionId: string;
  customer: { name?: string; email?: string; phone?: string; city?: string };
  lines: DocumentLine[];
  sendByEmail?: boolean;
}): Promise<ReceiptResult> {
  const apiName = process.env.CARDCOM_API_NAME;
  const apiPassword = process.env.CARDCOM_API_PASSWORD;
  if (!apiName || !apiPassword) return { ok: false, description: 'חסר CARDCOM_API_NAME / CARDCOM_API_PASSWORD' };
  const dealNumber = Number(params.transactionId);
  if (!Number.isFinite(dealNumber) || dealNumber <= 0) return { ok: false, description: 'מספר עסקה לא תקין' };

  const body = {
    ApiName: apiName,
    ApiPassword: apiPassword,
    DealNumbers: [{ DealNumber: dealNumber }], // קישור לעסקת האשראי הקיימת
    Document: {
      DocumentTypeToCreate: 'Receipt', // קבלה — מתאים לעוסק פטור
      Name: params.customer.name || 'לקוח',
      Email: params.customer.email || undefined,
      Mobile: params.customer.phone || undefined,
      City: params.customer.city || undefined,
      IsSendByEmail: params.sendByEmail !== false && !!params.customer.email,
      IsVatFree: true, // עוסק פטור — ללא מע"מ
      Languge: 'he',
      ISOCoinID: 1,
      Products: params.lines.map((l) => ({
        Description: l.description.slice(0, 250),
        UnitCost: Number(l.unitCost.toFixed(2)),
        Quantity: l.quantity,
      })),
    },
  };

  try {
    const res = await fetch('https://secure.cardcom.solutions/api/v11/Documents/CreateDocument', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const d = (await res.json()) as { ResponseCode?: number; Description?: string; DocumentInfo?: { DocumentNumber?: number; DocumentType?: string } };
    return {
      ok: d.ResponseCode === 0,
      documentNumber: d.DocumentInfo?.DocumentNumber,
      documentType: d.DocumentInfo?.DocumentType,
      description: d.Description,
      raw: d,
    };
  } catch (e) {
    return { ok: false, description: e instanceof Error ? e.message : 'שגיאת תקשורת מול קארדקום' };
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
