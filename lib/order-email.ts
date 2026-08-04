// ============================================================
// מיילי הזמנה — נשלחים רק לאחר תשלום מאומת (מתוך ה-webhook), דרך Resend.
// עובד משרת-לשרת (בניגוד ל-FormSubmit שנחסם ע"י Cloudflare מ-Vercel).
// Env: RESEND_API_KEY (סוד), BUSINESS_ORDER_EMAIL (מייל העסק),
//      RESEND_FROM (אופציונלי; ברירת מחדל onboarding@resend.dev — לעסק בלבד עד אימות דומיין).
// ============================================================

import 'server-only';
import type { FulfillmentOrder } from './orders';

const money = (n: number) => `₪${Math.round(n)}`;
const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

async function resendSend(to: string, subject: string, html: string): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return { ok: false, detail: 'missing key/to' };
  const from = process.env.RESEND_FROM || 'אמונה וביטחון <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
      cache: 'no-store',
    });
    const text = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, detail: text.slice(0, 200) };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'fetch error' };
  }
}

function wrap(inner: string): string {
  return `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#14233B">
    <div style="background:#0B132B;color:#E4CC7E;padding:16px 20px;border-radius:12px 12px 0 0;font-size:18px;font-weight:bold">אמונה וביטחון · יודאיקה</div>
    <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:20px">${inner}</div>
  </div>`;
}

function itemsTable(o: FulfillmentOrder): string {
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.title || i.id)} × ${i.quantity}</td><td style="padding:6px 0;text-align:left">${money(i.unitPrice * i.quantity)}</td></tr>`)
    .join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    ${o.discount ? `<tr><td>הנחה${o.couponCode ? ` (${esc(o.couponCode)})` : ''}</td><td style="text-align:left">-${money(o.discount)}</td></tr>` : ''}
    <tr><td>משלוח</td><td style="text-align:left">${o.shipping ? money(o.shipping) : 'חינם'}</td></tr>
    ${o.giftWrap ? `<tr><td>🎁 אריזת מתנה + כרטיס ברכה</td><td style="text-align:left">${money(o.giftWrap)}</td></tr>` : ''}
    <tr><td style="padding-top:8px;border-top:1px solid #eee;font-weight:bold">סה"כ ששולם</td><td style="padding-top:8px;border-top:1px solid #eee;text-align:left;font-weight:bold">${money(o.amount)}</td></tr>
  </table>`;
}

export async function sendOrderEmails(o: FulfillmentOrder): Promise<{ business: boolean; customer: boolean; detail?: string }> {
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  const c = o.customer;
  const addr = [c.street, c.city, c.zip].filter(Boolean).join(', ');

  // ---- מייל לעסק ----
  let business = false;
  let detail: string | undefined;
  if (biz) {
    const html = wrap(
      `<h2 style="margin:0 0 8px">🛒 הזמנה חדשה — ${esc(o.orderNumber)}</h2>
       ${itemsTable(o)}
       <h3 style="margin:18px 0 6px">פרטי הלקוח</h3>
       <div style="font-size:14px;line-height:1.7">
         <b>שם:</b> ${esc(c.name || '—')}<br>
         <b>טלפון:</b> ${esc(c.phone || '—')}<br>
         <b>אימייל:</b> ${esc(c.email || '—')}<br>
         <b>כתובת למשלוח:</b> ${esc(addr || '—')}
       </div>
       ${o.giftWrap && o.giftMessage ? `<h3 style="margin:18px 0 6px">כיתוב לכרטיס הברכה</h3><div style="white-space:pre-wrap;background:#faf7ef;border:1px solid #eee;border-radius:8px;padding:12px;font-size:14px">${esc(o.giftMessage)}</div>` : ''}`,
    );
    const r = await resendSend(biz, `🛒 הזמנה חדשה ${o.orderNumber} — ${money(o.amount)}`, html);
    business = r.ok;
    detail = r.detail;
  }

  // ---- מייל אישור ללקוח ----
  let customer = false;
  if (c.email) {
    const html = wrap(
      `<h2 style="margin:0 0 8px">תודה על הזמנתך! 🙏</h2>
       <p style="font-size:14px;color:#5C6678">קיבלנו את התשלום וההזמנה נכנסה לטיפול. נעדכן אותך בכל שלב.</p>
       <p style="font-size:14px"><b>מספר הזמנה:</b> ${esc(o.orderNumber)}</p>
       ${itemsTable(o)}
       ${addr ? `<p style="font-size:13px;color:#5C6678;margin-top:14px">משלוח אל: ${esc(addr)}</p>` : ''}
       <p style="font-size:13px;color:#5C6678;margin-top:16px">לכל שאלה אפשר להשיב למייל הזה. תודה שבחרתם באמונה וביטחון.</p>`,
    );
    const r = await resendSend(c.email, `אישור הזמנה ${o.orderNumber} — אמונה וביטחון`, html);
    customer = r.ok;
    if (!detail) detail = r.detail;
  }

  return { business, customer, detail };
}
