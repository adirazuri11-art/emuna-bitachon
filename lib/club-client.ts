// ============================================================
// חיבור צד-לקוח ל-API של המועדון (app/api/club).
// כל הקריאות דרך fetch לשרת — שם נאכפים ייחודיות הקוד והמימוש החד-פעמי.
// ============================================================

export interface JoinResult {
  ok: true;
  code: string;
  expires: number;
  pct: number;
  already?: boolean;
  used?: boolean;
}
export interface CouponResult {
  ok: true;
  discount: number;
  pct?: number; // קוד מועדון/סטטי
  type?: 'pct' | 'fixed'; // קופון מותאם מ-CRM
  value?: number;
  label: string;
  redeem?: boolean; // true = דורש מימוש אטומי בסיום (קוד מועדון חד-פעמי)
}
type Fail = { ok: false; error: string };

async function post<T>(body: Record<string, unknown>): Promise<T | Fail> {
  try {
    const r = await fetch('/api/club', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await r.json()) as T | Fail;
  } catch {
    return { ok: false, error: 'שגיאת רשת — נסו שוב' };
  }
}

/** הצטרפות: מקבל קוד אישי ייחודי מהשרת (אידמפוטנטי לפי מייל). */
export const joinClub = (email: string) => post<JoinResult>({ action: 'join', email });

/** אימות קוד בסל מול השרת. */
export const validateClubCoupon = (code: string, subtotal: number) =>
  post<CouponResult>({ action: 'validate', code, subtotal });

/** מימוש סופי בסיום הזמנה — חד-פעמי, אטומי. */
export const redeemClubCoupon = (code: string) => post<{ ok: true }>({ action: 'redeem', code });

/** האם הקוד/המייל שייך לחבר מועדון (למחירי-חבר). */
export const checkMember = (opts: { code?: string; email?: string }) =>
  post<{ ok: true; isMember: boolean }>({ action: 'member', ...opts });

// ---- זיהוי חבר במכשיר (הקוד האישי נשמר מקומית לאחר הצטרפות/אימות) ----
const MEMBER_KEY = 'emuna-club-code';

export function saveMemberCode(code: string) {
  if (typeof window !== 'undefined') localStorage.setItem(MEMBER_KEY, code);
}
export function getMemberCode(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(MEMBER_KEY) : null;
}
