# SECURITY_AUDIT — אמונה וביטחון (pre-payment)

בדיקה לא-הרסנית, קריאה בלבד. ללא מתקפות עומס.

## ✅ תקין
- **אין secrets ב-client bundle** — סריקת `.next/static` ל-SUPABASE_SERVICE_ROLE / service_role / CARDCOM_API / CRM_ACCESS_KEY / ANTHROPIC_API_KEY / sk-ant / SUPPLIER_WEBHOOK_SECRET / EMAILJS_API_KEY → 0 ממצאים.
- **Security headers (live):** CSP `default-src 'self'`, HSTS `max-age=63072000`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, connect-src מוגבל (self + GA + Supabase + Hebcal).
- **CRM גישה:** מאחורי sha256(CRM_ACCESS_KEY) cookie httpOnly; middleware חוסם /crm ללא session; כל /api/crm/* מאמת cookie.
- **קופונים/מועדון:** נאכפים בצד-שרת (service-role), לא ניתן לזייף מה-client.
- **Rate limiting:** קיים ב-/api/newsletter, /api/returns (per email/phone, 1-3/min).
- **סליקה:** אין פרטי אשראי/CVV נשמרים (אין סליקה עדיין).

## ⚠️ לטיפול בעת חיבור הסליקה (מחר)
- **סכום ההזמנה חייב להיחשב בצד-שרת** (כרגע client-side; ראה PAYMENT_INTEGRATION_READINESS / ISS-01).
- **Webhook סליקה חתום + Idempotent** (ISS-04).
- מימוש קופון להעביר ל-post-payment (ISS-02).

## הערות
- אין endpoint שמחזיר מידע לקוח עודף שנמצא בבדיקה זו.
- לא בוצעה בדיקת `npm audit` מלאה לתלויות במסגרת זו — מומלץ להריץ בנפרד לפני שדרוג חבילות.
