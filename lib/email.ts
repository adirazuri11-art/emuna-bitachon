// ============================================================
// שליחת מייל דרך API backend — מפתחות סודיים מוגנים
// קוראים ל-/api/email/send ב-Next.js (צד-שרת)
// ============================================================

export interface CouponEmailParams {
  toEmail: string;
  toName?: string;
  code: string;
  validUntil: string;
}

export const isEmailConfigured = () => true; // תמיד פעיל בצד-שרת

/** שולח את מייל קוד ההטבה ללקוח דרך API backend. */
export async function sendCouponEmail(p: CouponEmailParams): Promise<boolean> {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: p.toEmail,
        toName: p.toName ?? '',
        code: p.code,
        validUntil: p.validUntil,
      }),
    });
    const data = await res.json();
    return res.ok && data.ok;
  } catch {
    return false;
  }
}
