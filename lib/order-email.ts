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

interface Attachment { filename: string; content: string } // content = base64

async function resendSend(to: string, subject: string, html: string, replyTo?: string, attachments?: Attachment[]): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return { ok: false, detail: 'missing key/to' };
  const from = process.env.RESEND_FROM || 'אמונה וביטחון <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}), ...(attachments && attachments.length ? { attachments } : {}) }),
      cache: 'no-store',
    });
    const text = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, detail: text.slice(0, 200) };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'fetch error' };
  }
}

// הורדת קובץ הקבלה (PDF) מ-Cardcom והמרתו ל-base64 לצירוף למייל. best-effort.
async function fetchReceiptAttachment(url?: string): Promise<Attachment | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 8_000_000) return null; // הגנה
    return { filename: 'קבלה.pdf', content: buf.toString('base64') };
  } catch {
    return null;
  }
}

// מייל ברוכים-הבאים למועדון — נשלח בשרת בעת הצטרפות (קוד ההטבה) + התראה לעסק.
export async function sendClubWelcome(
  memberEmail: string,
  code: string,
  expiresMs: number,
  pct: number,
): Promise<{ member: boolean; business: boolean }> {
  const validUntil = new Date(expiresMs).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  const memberInner = `
    <p style="margin:2px 0 0;font-size:15px;color:${MUTED};line-height:1.7">ברוכים הבאים למשפחת אמונה וביטחון! 🙏<br>מגיעה לך הטבה מיוחדת להזמנה הראשונה:</p>
    <div style="text-align:center;margin:20px 0;background:#faf7ef;border:1px dashed ${GOLD};border-radius:14px;padding:22px">
      <div style="font-size:13px;color:${MUTED}">קוד ההטבה האישי שלך</div>
      <div style="font-size:28px;font-weight:800;color:${GOLD};letter-spacing:1px;margin-top:8px" dir="ltr">${esc(code)}</div>
      <div style="font-size:14px;color:${INK};margin-top:10px"><b>${pct}% הנחה</b> · בתוקף עד ${validUntil}</div>
    </div>
    <div style="text-align:center;margin-top:18px">
      <a href="${SITE}" style="background:${NAVY};color:${GOLD};text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:700;font-size:15px;display:inline-block">התחילו לקנות →</a>
    </div>`;
  const rm = await resendSend(memberEmail, 'קוד ההטבה שלך — מועדון אמונה וביטחון 🎁',
    shell('ברוכים הבאים למועדון! 🎁', memberInner, 'הזינו את הקוד בעמוד התשלום. בלי ספאם — רק הטבות אמיתיות.'),
    process.env.BUSINESS_ORDER_EMAIL || undefined);

  let business = false;
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  if (biz) {
    const bizInner = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px;color:${INK};line-height:2">
        <tr><td style="color:${MUTED};width:80px">אימייל</td><td>${esc(memberEmail)}</td></tr>
        <tr><td style="color:${MUTED}">קוד</td><td dir="ltr">${esc(code)}</td></tr>
        <tr><td style="color:${MUTED}">הטבה</td><td>${pct}% · בתוקף עד ${validUntil}</td></tr>
      </table>`;
    const rb = await resendSend(biz, `🎉 חבר מועדון חדש — ${memberEmail}`,
      shell('חבר מועדון חדש 🎉', bizInner, 'נרשם דרך פופאפ המועדון באתר.'));
    business = rb.ok;
  }
  return { member: rm.ok, business };
}

export async function sendOrderEmails(o: FulfillmentOrder, receiptUrl?: string): Promise<{ business: boolean; customer: boolean; detail?: string }> {
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  const c = o.customer;
  const addr = [c.street, c.city, c.zip].filter(Boolean).join(', ');
  const floorApt = [c.floor ? `קומה ${c.floor}` : '', c.apt ? `דירה ${c.apt}` : ''].filter(Boolean).join(' · ');
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
          ${floorApt ? `<tr><td style="color:${MUTED}">קומה/דירה</td><td>${esc(floorApt)}</td></tr>` : ''}
          ${c.entryCode ? `<tr><td style="color:${MUTED}">קוד כניסה</td><td>${esc(c.entryCode)}</td></tr>` : ''}
        </table>
      </div>
      ${o.giftWrap && o.giftMessage ? `<div style="margin-top:14px;background:#fdf6e3;border:1px solid ${LINE};border-radius:12px;padding:14px"><div style="font-size:13px;font-weight:700;color:${GOLD};margin-bottom:6px">🎁 כיתוב לכרטיס הברכה</div><div style="white-space:pre-wrap;font-size:14px;color:${INK}">${esc(o.giftMessage)}</div></div>` : ''}`;
    const html = shell(`🛒 הזמנה חדשה — ${money(o.amount)}`, inner, 'הזמנה זו שולמה ואומתה. מומלץ ליצור קשר עם הלקוח לתיאום.');
    // Reply-To = הלקוח, כדי שהעסק יוכל להשיב ישירות מהמייל
    const r = await resendSend(biz, `🛒 הזמנה חדשה ${o.orderNumber} — ${money(o.amount)}`, html, c.email || undefined);
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
      ${addr ? `<div style="margin-top:16px;font-size:13px;color:${MUTED}">📦 משלוח אל: <span style="color:${INK}">${esc(addr)}</span></div>` : ''}
      ${receiptUrl ? `<div style="margin-top:16px;font-size:13px;color:${MUTED}">🧾 קבלה על התשלום מצורפת למייל זה.</div>` : ''}`;
    const html = shell('תודה על הזמנתך! 🎁', inner, 'לכל שאלה אפשר להשיב למייל הזה. תודה שבחרתם באמונה וביטחון.');
    // צירוף קובץ הקבלה (PDF) — הקובץ מצורף, בלי מספר קבלה בטקסט ההודעה
    const receipt = await fetchReceiptAttachment(receiptUrl);
    // Reply-To = מייל העסק, כדי שתשובת הלקוח תגיע ל-lalevmedia
    const r = await resendSend(c.email, `אישור הזמנה ${o.orderNumber} — אמונה וביטחון`, html, biz || undefined, receipt ? [receipt] : undefined);
    customer = r.ok;
    if (!detail) detail = r.detail;
  }

  return { business, customer, detail };
}

// כפתור CTA "bulletproof" (טבלה) — נתמך גם ב-Outlook. זהב עם טקסט נייבי (ניגודיות תקינה).
function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:22px auto 6px"><tr>
    <td style="background:${GOLD};border-radius:999px" align="center">
      <a href="${esc(href)}" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:700;color:${NAVY};text-decoration:none">${esc(label)}</a>
    </td></tr></table>`;
}

// ---- עדכון משלוח ללקוח (נשלח כשההזמנה עוברת ל"במשלוח") ----
export async function sendShippingNotification(o: FulfillmentOrder, tracking?: string): Promise<{ ok: boolean; detail?: string }> {
  const c = o.customer;
  if (!c.email) return { ok: false, detail: 'no customer email' };
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  const addr = [c.street, c.city, c.zip].filter(Boolean).join(', ');
  const inner = `
    <p style="margin:2px 0 0;font-size:15px;color:${MUTED};line-height:1.7">שלום ${esc(c.name || '')},<br>הזמנתך ארוזה ויצאה לדרך אלייך 🚚 מיד תהיה אצלך.</p>
    <div style="margin-top:14px;font-size:13px;color:${MUTED}">מספר הזמנה <b style="color:${INK}">${esc(o.orderNumber)}</b></div>
    ${itemsBlock(o)}
    ${addr ? `<div style="margin-top:16px;font-size:13px;color:${MUTED}">📦 נשלח אל: <span style="color:${INK}">${esc(addr)}</span></div>` : ''}
    ${tracking ? `<div style="margin-top:10px;font-size:13px;color:${MUTED}">🔎 מספר מעקב: <b style="color:${INK}" dir="ltr">${esc(tracking)}</b></div>` : ''}
    <div style="margin-top:8px;font-size:13px;color:${MUTED}">זמן אספקה משוער: 1–3 ימי עסקים.</div>`;
  const html = shell('הזמנתך יצאה לדרך! 🚚', inner, 'לכל שאלה על המשלוח אפשר להשיב למייל הזה. תודה שבחרתם באמונה וביטחון.');
  const r = await resendSend(c.email, `הזמנתך ${o.orderNumber} יצאה למשלוח — אמונה וביטחון`, html, biz || undefined);
  return { ok: r.ok, detail: r.detail };
}

// ---- בקשת חוות דעת (נשלח כשההזמנה מסומנת "בוצעה בהצלחה") ----
export async function sendReviewRequest(o: FulfillmentOrder): Promise<{ ok: boolean; detail?: string }> {
  const c = o.customer;
  if (!c.email) return { ok: false, detail: 'no customer email' };
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  // קישור לעמוד המוצר הראשון שנרכש, ישירות לאזור חוות הדעת.
  const first = o.items[0];
  const slug = first ? String(first.id).toLowerCase() : '';
  const reviewHref = slug ? `${SITE}/product/${slug}#reviews` : `${SITE}`;
  const stars = `<div style="text-align:center;font-size:30px;letter-spacing:6px;color:${GOLD};margin:4px 0 2px">★★★★★</div>`;
  const inner = `
    <p style="margin:2px 0 0;font-size:15px;color:${MUTED};line-height:1.7">שלום ${esc(c.name || '')},<br>מקווים שאתם נהנים מ${first?.title ? `“${esc(first.title)}”` : 'ההזמנה'} 🙏<br>נשמח מאוד אם תשתפו חוות דעת קצרה — זה עוזר למשפחות אחרות לבחור, ולנו להמשיך להשתפר.</p>
    ${stars}
    ${ctaButton(reviewHref, 'לכתיבת חוות דעת ✍️')}
    <div style="text-align:center;font-size:12px;color:${MUTED};margin-top:4px">דקה אחת, ומשמעותי מאוד עבורנו 💛</div>`;
  const html = shell('איך הייתה החוויה? 🌟', inner, 'תודה שבחרתם באמונה וביטחון. לכל שאלה אפשר להשיב למייל הזה.');
  const r = await resendSend(c.email, 'נשמח לשמוע — חוות דעת על ההזמנה שלך 🌟', html, biz || undefined);
  return { ok: r.ok, detail: r.detail };
}

// ---- דייג'סט יומי לעסק (נשלח ע"י cron) ----
export interface DailyDigest {
  dateLabel: string;
  revenue: number;
  orders: number;
  grossProfit: number;
  aov: number;
  abandoned: number;
  topCategory?: string;
}
export async function sendDailyDigest(d: DailyDigest): Promise<{ ok: boolean; detail?: string }> {
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  if (!biz) return { ok: false, detail: 'no business email' };
  const cell = (label: string, value: string, accent = false) => `
    <td style="padding:6px" width="50%" valign="top">
      <div style="background:#faf7ef;border:1px solid ${LINE};border-radius:12px;padding:16px">
        <div style="font-size:12px;color:${MUTED}">${label}</div>
        <div style="font-size:26px;font-weight:800;color:${accent ? GOLD : INK};margin-top:4px;font-variant-numeric:tabular-nums">${value}</div>
      </div>
    </td>`;
  const inner = `
    <p style="margin:2px 0 0;font-size:15px;color:${MUTED};line-height:1.7">סיכום הפעילות ל־${esc(d.dateLabel)}:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
      <tr>${cell('הכנסות', money(d.revenue))}${cell('רווח גולמי', money(d.grossProfit), true)}</tr>
      <tr>${cell('הזמנות', String(d.orders))}${cell('ממוצע להזמנה', d.aov ? money(d.aov) : '—')}</tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;font-size:14px;color:${INK};line-height:2">
      ${d.topCategory ? `<tr><td style="color:${MUTED};width:130px">קטגוריה מובילה</td><td>${esc(d.topCategory)}</td></tr>` : ''}
      ${d.abandoned ? `<tr><td style="color:${MUTED}">קופות נטושות</td><td>${d.abandoned} ממתינות לשחזור</td></tr>` : ''}
    </table>
    ${ctaButton(`${SITE}/crm`, 'פתיחת מרכז השליטה')}`;
  const html = shell(`סיכום יומי · ${esc(d.dateLabel)} 📊`, inner, 'דוח אוטומטי ממרכז השליטה של אמונה וביטחון.');
  const r = await resendSend(biz, `📊 סיכום יומי — ${money(d.revenue)} · ${d.orders} הזמנות`, html);
  return { ok: r.ok, detail: r.detail };
}

// שליחת קבלה בלבד ללקוח (backfill/רטרו) — הקובץ מצורף, בלי מספר בטקסט.
export async function sendReceiptEmail(o: FulfillmentOrder, receiptUrl: string): Promise<{ ok: boolean; detail?: string }> {
  const c = o.customer;
  if (!c.email) return { ok: false, detail: 'no customer email' };
  const biz = process.env.BUSINESS_ORDER_EMAIL;
  const receipt = await fetchReceiptAttachment(receiptUrl);
  if (!receipt) return { ok: false, detail: 'could not fetch receipt pdf' };
  const inner = `
    <p style="margin:2px 0 0;font-size:15px;color:${MUTED};line-height:1.7">שלום ${esc(c.name || '')},<br>מצורפת הקבלה על התשלום עבור הזמנה <b style="color:${INK}">${esc(o.orderNumber)}</b>.</p>
    <div style="margin-top:14px;font-size:13px;color:${MUTED}">🧾 הקבלה מצורפת כקובץ PDF למייל זה.</div>`;
  const html = shell('הקבלה שלך 🧾', inner, 'תודה שבחרתם באמונה וביטחון. לכל שאלה אפשר להשיב למייל הזה.');
  const r = await resendSend(c.email, `קבלה על הזמנה ${o.orderNumber} — אמונה וביטחון`, html, biz || undefined, [receipt]);
  return { ok: r.ok, detail: r.detail };
}
