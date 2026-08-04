// ============================================================
// מיילי הזמנה — נשלחים רק לאחר תשלום מאומת (מתוך ה-webhook).
// שימוש ב-FormSubmit (ללא הגדרת ספק): הודעה מלאה לעסק + אישור אוטומטי ללקוח.
// דורש BUSINESS_ORDER_EMAIL (מייל העסק). הפעלה חד-פעמית: העסק מאשר את המייל הראשון.
// ============================================================

import 'server-only';
import type { FulfillmentOrder } from './orders';

const money = (n: number) => `₪${Math.round(n)}`;

export async function sendOrderEmails(o: FulfillmentOrder): Promise<{ business: boolean; status?: number; detail?: string }> {
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  if (!biz) return { business: false };

  const c = o.customer;
  const itemsText = o.items
    .map((i) => `• ${i.title || i.id} × ${i.quantity} — ${money(i.unitPrice * i.quantity)}`)
    .join('\n');
  const addr = [c.street, c.city, c.zip].filter(Boolean).join(', ');

  const customerConfirmation =
    `תודה על הזמנתך באמונה וביטחון! 🙏\n\n` +
    `מספר הזמנה: ${o.orderNumber}\n` +
    `סכום ששולם: ${money(o.amount)}\n\n` +
    `קיבלנו את התשלום וההזמנה נכנסה לטיפול. נעדכן אותך בכל שלב בהכנת ההזמנה.\n` +
    `לכל שאלה אפשר להשיב למייל הזה או לכתוב לנו בוואטסאפ.`;

  const payload: Record<string, string> = {
    _subject: `🛒 הזמנה חדשה ${o.orderNumber} — ${money(o.amount)}`,
    _template: 'table',
    _captcha: 'false',
    'מספר הזמנה': o.orderNumber,
    'סכום ששולם': money(o.amount),
    מוצרים: itemsText,
    הנחה: o.discount ? `${money(o.discount)}${o.couponCode ? ` (${o.couponCode})` : ''}` : '—',
    משלוח: o.shipping ? money(o.shipping) : 'חינם',
    'אריזת מתנה': o.giftWrap ? `כן (${money(o.giftWrap)})` : 'לא',
    'ברכה לכרטיס': o.giftMessage || '—',
    'שם לקוח': c.name || '—',
    טלפון: c.phone || '—',
    'אימייל לקוח': c.email || '—',
    'כתובת למשלוח': addr || '—',
    // אישור אוטומטי ללקוח — נשלח לכתובת שבשדה email
    email: c.email || '',
    _autoresponse: customerConfirmation,
  };

  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emunavebitachon.co.il';
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(biz)}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        // FormSubmit חוסם קריאות ללא הקשר דפדפן — כותרות אלה נדרשות משרת-לשרת.
        Origin: site,
        Referer: `${site}/`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const text = await res.text().catch(() => '');
    let success: string | undefined;
    try { success = (JSON.parse(text) as { success?: string }).success; } catch { /* non-JSON */ }
    return { business: res.ok && success === 'true', status: res.status, detail: text.slice(0, 200) };
  } catch (e) {
    return { business: false, detail: e instanceof Error ? e.message : 'fetch error' };
  }
}
