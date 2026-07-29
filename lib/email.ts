// ============================================================
// שליחת מייל ללקוח דרך EmailJS — אמין, מעוצב, נשלח מה-Gmail של העסק.
// עובד בצד-לקוח (בלי שרת), כולל באתר סטטי. חינמי עד 200 מיילים/חודש.
// הגדרה: 3 מזהים ב-.env (NEXT_PUBLIC_EMAILJS_*). ללא הגדרה — מדלג בשקט
// (בעל האתר עדיין מקבל התראה דרך FormSubmit, והקוד מוצג על המסך).
// ============================================================

const SERVICE = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export const isEmailConfigured = () => Boolean(SERVICE && TEMPLATE && PUBLIC_KEY);

export interface CouponEmailParams {
  toEmail: string;
  toName?: string;
  code: string;
  validUntil: string;
}

/** שולח את מייל קוד ההטבה ללקוח. מחזיר true אם נשלח בהצלחה. */
export async function sendCouponEmail(p: CouponEmailParams): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: SERVICE,
        template_id: TEMPLATE,
        user_id: PUBLIC_KEY,
        template_params: {
          to_email: p.toEmail,
          to_name: p.toName ?? '',
          coupon: p.code,
          valid_until: p.validUntil,
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
