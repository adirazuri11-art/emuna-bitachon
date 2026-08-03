# CRM_SYSTEM_AUDIT — אמונה וביטחון

> Phase 1 · מסמך חקירה מבוסס-קוד. כל ממצא כאן מאומת מול קבצים אמיתיים ברפו, לא הנחה.
> נכתב על גבי commit `47cbe13`. Branch: `feature/emuna-advanced-ai-crm`.

---

## 1. הארכיטקטורה הקיימת (מאומת)

| רכיב | טכנולוגיה | ראיה בקוד |
|---|---|---|
| Framework | Next.js 14.2.15 (App Router) | `package.json`, `app/` |
| שפה | TypeScript, React 18.3 | `package.json` |
| עיצוב | Tailwind, RTL, `font-display` | `tailwind.config`, `app/globals.css` |
| Deployment | Vercel | `.vercel/`, `vercel deploy` |
| DB | Supabase PostgreSQL | `NEXT_PUBLIC_SUPABASE_URL`, `lib/supabase.ts` |
| ORM | Prisma 5.20 | `prisma/schema.prisma` (364 שורות) |
| State | Zustand (סל, UI) | `store/` |
| Data fetch | @tanstack/react-query | `Navbar.tsx` (Hebcal), ועוד |
| AI SDK | `@ai-sdk/anthropic`, `ai` | תלות ב-`package.json` (כרגע ללa route פעיל) |
| Analytics | GA4 (gtag) | `lib/ga4-events.ts`, `lib/analytics.ts` |
| Email | EmailJS | `EMAILJS_*` env, `lib/email.ts` |
| Newsletter alert | FormSubmit | `/api/newsletter/subscribe` |
| WhatsApp | קישור `wa.me` בלבד (לא Business API) | `Navbar.tsx` |
| תשלום | Cardcom — **stub/TODO** | `lib/payments.ts:51` |

---

## 2. מקור האמת לכל סוג מידע (הממצא המרכזי)

זהו הממצא הקריטי ביותר לפרויקט ה-CRM.

| נתון | היכן נמצא היום | מתמיד (persisted)? | זמין ל-CRM לקריאה? |
|---|---|---|---|
| **מוצרים** | `lib/catalog.ts` + `lib/supplier-products.json` (קובץ סטטי) | ❌ קובץ קוד, לא DB | ✅ (import סטטי / build-time) |
| **קטגוריות** | `lib/catalog.ts` (מערך) | ❌ קובץ קוד | ✅ סטטי |
| **חברי מועדון** | Prisma `ClubMember` → Supabase | ✅ **כן** | ✅ דרך `/api/club` (עם `CLUB_ADMIN_KEY`) |
| **קופונים** | Supabase table `coupons` | ✅ **כן** | ✅ דרך `/api/coupons/*` |
| **הזמנות** | `lib/db-fallback.ts` → **localStorage** בלבד | ❌ **לא נשמר בשרת** | ❌ **אין** |
| **תשלומים / Cardcom** | `lib/payments.ts` — `TODO` לא ממומש | ❌ | ❌ |
| **לקוחות (מלא)** | לא קיים — רק email של חבר מועדון | ❌ | חלקי (email בלבד) |
| **עגלות / עגלות נטושות** | Zustand בצד-לקוח בלבד | ❌ | ❌ |
| **מאתר המתנה — sessions/תשובות** | client-side, `trackEvent` ל-GA4 בלבד | ❌ **לא נשמר** | ❌ (רק ב-GA4) |
| **אירועי אתר / Attribution** | GA4 בלבד | ❌ בשרת שלנו | דרך GA4 API בעתיד |
| **Prisma models `Order/OrderItem/User/Product/Category`** | קיימים ב-schema | ⚠️ **מוגדרים אך לא נכתבים** ע"י שום flow | — |

### מסקנה מחייבת
> **הנתונים שה-CRM אמור להציג — הזמנות, Customer 360, עגלות נטושות, אנליטיקת מאתר המתנה, דשבורד מכירות — אינם קיימים היום בשום מאגר שאפשר לשאול.** האתר לא מתמיד אותם.
>
> הנתון האמיתי היחיד שמתמיד בשרת כרגע: **חברי מועדון (ClubMember)** ו-**קופונים**.
>
> לכן, בניית דשבורד CRM "מחובר לנתונים אמיתיים" **אינה אפשרית עדיין** — היא הייתה בהכרח דשבורד Mock, וזה **אסור מפורשות** לפי הדרישות (שלב 35).

---

## 3. אינטגרציות קיימות

| אינטגרציה | סטטוס | קובץ |
|---|---|---|
| Supabase (Postgres) | פעיל (ClubMember, coupons) | `lib/supabase.ts`, `lib/prisma.ts` |
| GA4 | פעיל (gtag + events) | `lib/ga4-events.ts` |
| EmailJS | מוגדר (תלוי env) | `lib/email.ts` |
| FormSubmit | פעיל (התראת newsletter) | `/api/newsletter/subscribe` |
| Hebcal | פעיל (סרגל עליון) | `Navbar.tsx` |
| Cardcom | **לא ממומש** (TODO) | `lib/payments.ts` |
| Supplier webhook | קיים, מאובטח ב-`SUPPLIER_WEBHOOK_SECRET` | `/api/webhooks/suppliers` |
| WhatsApp Business API | ❌ לא קיים (רק wa.me) | — |
| Google (GA4 API / GSC / Ads / Gmail / Calendar) | ❌ לא מחובר | — |
| Auth / back-office login | ❌ **לא קיים** (רק `CLUB_ADMIN_KEY` shared-secret) | — |

---

## 4. הסיכונים הקיימים

1. **אין מקור אמת להזמנות** — כל בסיס ה-CRM התפעולי (הזמנות, לקוחות, LTV, RFM) חסר דאטה.
2. **אין מערכת Auth לבק-אופיס** — נדרשת מאפס עבור CRM (RBAC, sessions, MFA).
3. **Cardcom לא ממומש** — ייתכן שאין כרגע זרימת תשלום שרתית פעילה (בניגוד לרושם ממסמכים ישנים). **דורש אימות מול אדיר.**
4. **מפתחות רגישים** — `SUPABASE_SERVICE_ROLE_KEY`, `CLUB_ADMIN_KEY`, `CARDCOM_*` קיימים כ-env. חובה לוודא שאינם דולפים ל-client bundle.
5. **מאתר המתנה** — אין שמירת sessions; לכן "Gift Finder Optimization Agent" חסר דאטה עד שנוסיף instrumentation.

---

## 5. נקודות חיבור בטוחות (read-only) שקיימות היום

- `GET /api/club` (list) — חברי מועדון, עם `CLUB_ADMIN_KEY`.
- Supabase `coupons` (read) — דרך service-role בצד-שרת בלבד.
- קטלוג סטטי (`lib/catalog.ts`) — import ל-build של ה-CRM (מוצרים/קטגוריות).
- GA4 Data API (עתידי, דרך OAuth) — תנועה/מקורות/funnels.

---

## 6. מערכות שאסור לגעת בהן (Freeze list)

מוצרים · קטגוריות · שמות · slugs · URLs · מחירים · מלאי · קופונים פעילים · חוקי חברי מועדון · סליקה · מאתר המתנה (לוגיקה) · עיצוב/תוכן האתר · SEO. — כל אלה **read-only** בשלב הראשון.

---

## 7. המלצת ארכיטקטורה (מיקום ה-CRM)

**המלצה: אפליקציה נפרדת ומאובטחת** (כברירת המחדל שהוגדרה), ולא העמסה על ה-Frontend של האתר.

נימוק מבוסס-קוד:
- האתר בנוי כ-storefront (Vercel, static-heavy). CRM עם RBAC, queues, OAuth ל-Google, ו-AI tools — עומס וסיכון שונה לחלוטין.
- הפרדה = כשל ב-CRM לעולם לא מפיל את האתר (דרישה מפורשת).
- ניתן לשתף את **אותו Supabase Postgres** (schema/סכמה נפרדת ל-CRM) כדי לא לשכפל דאטה — או DB נפרד. החלטה לאדיר (ראה שאלות).

מיקום קוד מומלץ: **monorepo** (`apps/site`, `apps/crm`, `packages/shared`) או ריפו נפרד. אני ממליץ להתחיל כ-**ריפו/פרויקט CRM נפרד** שמושך נתונים דרך API/Webhooks — הכי בטוח לאתר החי.

---

## 8. הפער האמיתי לפני CRM: שכבת Instrumentation (Phase 2 האמיתי)

לפני שיש ל-CRM מה להציג, האתר חייב **להתחיל לשמור** את הדאטה — בצורה אדיטיבית, אסינכרונית, שלא מפילה ולא מעכבת את האתר:

1. **שמירת הזמנה** ב-webhook הצלחת-תשלום (כש-Cardcom יחובר) → טבלת `orders` אמיתית.
2. **שמירת sessions של מאתר המתנה** (תשובות, המלצות, קליקים, רכישה) → מזין את ה-Gift Finder Agent.
3. **אירועי מסחר** (view/add-to-cart/checkout_started/abandoned) → מזין עגלות נטושות + attribution.
4. **רשומת לקוח מאוחדת** (customer) מעבר ל-email של חבר מועדון.

כל אלה אירועים לא-קריטיים שנשלחים אסינכרונית; כשל בהם לא נוגע בחוויית הקנייה.

---

## 9. שלבים (מותאם למצב האמיתי)

- **Phase 1 — ✅ המסמך הזה:** Audit + Architecture + Data/Security model + החלטות.
- **Phase 2 — Instrumentation (בתוך האתר, אדיטיבי):** שמירת orders/gift-finder/events → יצירת דאטה אמיתי. Read-only מבחינת מה שקיים; write רק לטבלאות חדשות.
- **Phase 3 — CRM Core (אפליקציה נפרדת):** Auth+RBAC, Dashboard, Customers, Orders, Club — קורא דאטה אמיתי בלבד.
- **Phase 4 — Google (OAuth): GA4/GSC/Gmail/Calendar/Ads.**
- **Phase 5 — Operations:** משימות, פניות, Inbox, Automations.
- **Phase 6 — AI Copilot (tools מאובטחים, ללא SQL חופשי, approval gates).**
- **Phase 7 — Agents ייעודיים.**
- **Phase 8 — Controlled Write to site (רק עם approval + rollback).**

לא ממשיכים ל-Phase הבא לפני שהנוכחי עבר בדיקות ואישור.
