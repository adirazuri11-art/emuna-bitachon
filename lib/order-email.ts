// ============================================================
// מיילי הזמנה מעוצבים — נשלחים לאחר תשלום מאומת דרך Resend.
// עיצוב מקצועי (RTL, טבלאות email-safe, inline styles) + תמונת מוצר ליד כל פריט.
// Env: RESEND_API_KEY, BUSINESS_ORDER_EMAIL, RESEND_FROM.
// ============================================================

import 'server-only';
import type { FulfillmentOrder } from './orders';
import { PRODUCTS } from './catalog';

const SITE = 'https://emunavebitachon.co.il';
const NAVY = '#0B132B';
const GOLD = '#B08526';
const INK = '#14233B';
const MUTED = '#6B7280';
const LINE = '#ECE6D6';

const IMG_BY_ID = new Map<string, string | undefined>(PRODUCTS.map((p) => [p.id, p.imageUrl]));

const money = (n: number) => `₪${Math.round(n)}`;
const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

// כתובת תמונה מוחלטת; SVG לא נתמך ב-Gmail → מוחזר null (fallback לפלייסהולדר).
function productImage(id: string): string | null {
  const u = IMG_BY_ID.get(id);
  if (!u) return null;
  const abs = u.startsWith('http') ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`;
  if (abs.toLowerCase().endsWith('.svg')) return null;
  return abs;
}

function thumb(id: string): string {
  const src = productImage(id);
  if (src) {
    return `<img src="${esc(src)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid ${LINE};background:#faf7ef" />`;
  }
  return `<div style="width:56px;height:56px;border-radius:10px;border:1px solid ${LINE};background:#faf7ef;text-align:center;line-height:56px;font-size:22px">🎁</div>`;
}

function itemRows(o: FulfillmentOrder): string {
  return o.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;width:64px;vertical-align:top">${thumb(i.id)}</td>
        <td style="padding:10px 12px;vertical-align:top">
          <div style="font-size:15px;font-weight:600;color:${INK}">${esc(i.title || i.id)}</div>
          <div style="font-size:13px;color:${MUTED};margin-top:2px">כמות: ${i.quantity}</div>
        </td>
        <td style="padding:10px 0;vertical-align:top;text-align:left;white-space:nowrap;font-size:15px;font-weight:600;color:${INK}">${money(i.unitPrice * i.quantity)}</td>
      </tr>`,
    )
    .join('');
}

function summaryRows(o: FulfillmentOrder): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr>
       <td style="padding:5px 0;font-size:14px;color:${strong ? INK : MUTED};${strong ? 'font-weight:700' : ''}">${label}</td>
       <td style="padding:5px 0;text-align:left;font-size:14px;color:${strong ? INK : MUTED};${strong ? 'font-weight:700' : ''}">${value}</td>
     </tr>`;
  return `
    ${o.discount ? row(`הנחה${o.couponCode ? ` · ${esc(o.couponCode)}` : ''}`, `-${money(o.discount)}`) : ''}
    ${row('משלוח', o.shipping ? money(o.shipping) : 'חינם')}
    ${o.giftWrap ? row('🎁 אריזת מתנה + כרטיס ברכה', money(o.giftWrap)) : ''}
    <tr><td colspan="2" style="padding:6px 0"><div style="border-top:1px solid ${LINE}"></div></td></tr>
    ${row('סה"כ ששולם', money(o.amount), true)}`;
}

function shell(title: string, bodyInner: string, footerNote: string): string {
  return `<!doctype html><html dir="rtl" lang="he"><body style="margin:0;background:#f4f1ea;padding:24px 12px;font-family:'Segoe UI',Arial,'Helvetica Neue',sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
    <tr><td style="background:${NAVY};border-radius:16px 16px 0 0;padding:22px 26px" align="center">
      <div style="font-size:22px;font-weight:800;color:${GOLD};letter-spacing:.5px">אמונה וביטחון</div>
      <div style="font-size:12px;color:#c9cdd6;margin-top:3px;letter-spacing:2px">יודאיקה יוקרתית · מדור לדור</div>
    </td></tr>
    <tr><td style="background:#ffffff;padding:26px">
      <h1 style="margin:0 0 4px;font-size:20px;color:${INK}">${title}</h1>
      ${bodyInner}
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;border-top:1px solid ${LINE};padding:18px 26px;text-align:center">
      <div style="font-size:12px;color:${MUTED};line-height:1.7">${footerNote}</div>
      <div style="font-size:12px;color:${MUTED};margin-top:6px">
        <a href="${SITE}" style="color:${GOLD};text-decoration:none">emunavebitachon.co.il</a>
      </div>
    </td></tr>
  </table></body></html>`;
}

function itemsBlock(o: FulfillmentOrder): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">${itemRows(o)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid ${LINE};padding-top:8px">${summaryRows(o)}</table>`;
}

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

export async function sendOrderEmails(o: FulfillmentOrder): Promise<{ business: boolean; customer: boolean; detail?: string }> {
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  const c = o.customer;
  const addr = [c.street, c.city, c.zip].filter(Boolean).join(', ');
  let detail: string | undefined;

  // ---- מייל לעסק ----
  let business = false;
  if (biz) {
    const inner = `
      <div style="font-size:13px;color:${MUTED};margin-bottom:2px">מספר הזמנה <b style="color:${INK}">${esc(o.orderNumber)}</b></div>
      ${itemsBlock(o)}
      <div style="margin-top:20px;background:#faf7ef;border:1px solid ${LINE};border-radius:12px;padding:16px">
        <div style="font-size:14px;font-weight:700;color:${INK};margin-bottom:8px">פרטי הלקוח והמשלוח</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:${INK};line-height:1.9">
          <tr><td style="color:${MUTED};width:70px">שם</td><td>${esc(c.name || '—')}</td></tr>
          <tr><td style="color:${MUTED}">טלפון</td><td><a href="tel:${esc(c.phone || '')}" style="color:${INK};text-decoration:none">${esc(c.phone || '—')}</a></td></tr>
          <tr><td style="color:${MUTED}">אימייל</td><td>${esc(c.email || '—')}</td></tr>
          <tr><td style="color:${MUTED}">כתובת</td><td>${esc(addr || '—')}</td></tr>
        </table>
      </div>
      ${o.giftWrap && o.giftMessage ? `<div style="margin-top:14px;background:#fdf6e3;border:1px solid ${LINE};border-radius:12px;padding:14px"><div style="font-size:13px;font-weight:700;color:${GOLD};margin-bottom:6px">🎁 כיתוב לכרטיס הברכה</div><div style="white-space:pre-wrap;font-size:14px;color:${INK}">${esc(o.giftMessage)}</div></div>` : ''}`;
    const html = shell(`🛒 הזמנה חדשה — ${money(o.amount)}`, inner, 'הזמנה זו שולמה ואומתה. מומלץ ליצור קשר עם הלקוח לתיאום.');
    const r = await resendSend(biz, `🛒 הזמנה חדשה ${o.orderNumber} — ${money(o.amount)}`, html);
    business = r.ok;
    detail = r.detail;
  }

  // ---- מייל אישור ללקוח ----
  let customer = false;
  if (c.email) {
    const inner = `
      <p style="margin:2px 0 0;font-size:15px;color:${MUTED};line-height:1.7">קיבלנו את התשלום וההזמנה נכנסה לטיפול 🙏<br>נעדכן אותך בכל שלב בהכנת ההזמנה.</p>
      <div style="margin-top:14px;font-size:13px;color:${MUTED}">מספר הזמנה <b style="color:${INK}">${esc(o.orderNumber)}</b></div>
      ${itemsBlock(o)}
      ${addr ? `<div style="margin-top:16px;font-size:13px;color:${MUTED}">📦 משלוח אל: <span style="color:${INK}">${esc(addr)}</span></div>` : ''}`;
    const html = shell('תודה על הזמנתך! 🎁', inner, 'לכל שאלה אפשר להשיב למייל הזה. תודה שבחרתם באמונה וביטחון.');
    const r = await resendSend(c.email, `אישור הזמנה ${o.orderNumber} — אמונה וביטחון`, html);
    customer = r.ok;
    if (!detail) detail = r.detail;
  }

  return { business, customer, detail };
}
