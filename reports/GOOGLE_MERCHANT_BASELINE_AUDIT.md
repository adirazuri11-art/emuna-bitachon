# GOOGLE MERCHANT CENTER — BASELINE AUDIT

**פרויקט:** אמונה וביטחון · https://emunavebitachon.co.il
**תאריך:** 2026-08-05
**Branch:** `feature/google-merchant-center-automatic-sync`
**Commit התחלה:** `c5c2327`

---

## 1. ארכיטקטורת האתר

| רכיב | מימוש |
|------|-------|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18 + TypeScript + Tailwind (RTL) |
| Backend | Next.js Route Handlers (API routes) |
| בסיס נתונים | Neon Postgres (via Prisma raw) — הזמנות/מועדון/CRM בלבד |
| אחסון | Vercel (project `emuna-bitachon`, org `adir3`) |
| Production | https://emunavebitachon.co.il |
| Preview | Vercel preview deployments |
| פריסה | **`vercel --prod` (CLI)** — push ל-GitHub אינו מפעיל בנייה אוטומטית |

## 2. מקור האמת של המוצרים

**קובץ יחיד:** `lib/supplier-products.json` (ספק ART Judaica / israel-judaica.com — לקוח מורשה).
נגזר ל-`CatalogProduct[]` ב-`lib/catalog-supplier.ts` → מיוצא כ-`PRODUCTS` ב-`lib/catalog.ts`.
המוצרים **מנוהלים בקוד ונפרסים** — "מוצר חדש" = הוספה ל-JSON + deploy. אין DB מוצרים נפרד.

- **מחיר:** `retail(cost)` — markup מדורג (×2.25–2.4) + עיגול פסיכולוגי. אין `discountPrice` ציבורי (הטבת מועדון/קופון חלה ב-checkout בלבד).
- **מלאי:** `stockStatus` = `in-stock` | `coming-soon` (18 מוצרים) — נגזר ממפת `COMING_SOON`.
- **תמונות:** `img` (webp מרוחק) / `imgFull` / מקומי `/images/supplier-real/<SKU>.jpg`.
- **וריאציות:** מוצרי הספק **ללא** variantGroups — כל פריט עצמאי (אין צורך ב-item_group_id).

## 3. הקטלוג במספרים (מאומת)

| מדד | ערך |
|-----|-----|
| סה"כ מוצרים | **799** |
| חסרי מחיר | 0 |
| חסרי כותרת | 0 |
| כפילויות ID | 0 |
| תמונה מרוחקת (webp) | 560 |
| תמונה מלאה (imgFull) | 8 |
| תמונה מקומית | 231 (232 קבצים קיימים ✓) |
| coming-soon (preorder) | 18 |
| קטגוריות | 18 פעילות |

**פירוט קטגוריות:** כיפות 190 · ברכות 99 · נטלות 85 · תשמישי קדושה לבית 67 · תכשיטים 50 · מזוזות 48 · הבדלה 43 · ספרים 35 · כוסות קידוש 33 · חגים 32 · ציציות/טליתות 29 · פמוטים 28 · מתנות 21 · כיסויי חלה 21 · אמנות 8 · ילדים 5 · ברית/לידה 4 · מטפחות 1.

## 4. אינטגרציות Google קיימות

| אינטגרציה | מצב |
|-----------|-----|
| Product Structured Data (JSON-LD) | ✅ קיים ומלא ב-`app/product/[slug]/page.tsx` (Product+Offer+shipping+returns+Breadcrumb) |
| sitemap.xml / robots.txt | ✅ קיים |
| Google Search Console | קוד אינטגרציה ב-`lib/crm/google.ts` (service-account, GA4+GSC) |
| Merchant Center feed | ❌ **לא היה** — נוצר במשימה זו |
| Content API / Merchant API | ❌ לא קיים |
| Shopping plugin | ❌ לא קיים (אין CMS/plugin — אתר קוד) |
| Data Source ב-Merchant | ❌ לא קיים — **אין סכנת כפילות** |

## 5. החלטות תקן לפיד

- **brand** = `אמונה וביטחון` — מותג הקמעונאי. אין מותג יצרן נפרד ליודאיקה גנרית.
- **mpn** = SKU הספק (למשל `UK67651`) — קוד קטלוג ART Judaica, מזהה חלק אמיתי.
- **gtin** — לא קיים, לא מומצא. brand+mpn מספקים לקטגוריות Religious Items.
- **google_product_category** = `96` (Religious Items) כברירת מחדל; תכשיטים→`188`, ספרים→`784`.
- **price** = `basePrice` בלבד (מחיר לכלל הציבור), בפורמט `NN.00 ILS`. ללא sale_price (אין מבצע ציבורי).
- **availability** = `in_stock` / `preorder` (coming-soon).

## 6. סיכונים

| סיכון | חומרה | מיטיגציה |
|-------|-------|----------|
| Hotlink תמונות מ-israel-judaica | נמוך | נבדק — מחזיר 200 גם ללא Referer ל-Googlebot ✓ |
| אין GTIN | נמוך | brand+mpn חוקי ל-Religious Items; ייתכנו אזהרות לא-חוסמות |
| מותג "אמונה וביטחון" על מוצר ספק | נמוך | מקובל לקמעונאי own-brand ביודאיקה; מתועד |
| "מוצר חדש אוטומטי" = דורש deploy | בינוני | אין DB מוצרים; הקטלוג בקוד. מתועד כהתנהגות מכוונת |

## 7. דרך החיבור המומלצת

**פיד XML אוטומטי + Scheduled Fetch** (מנגנון בסיס יציב) —
`https://emunavebitachon.co.il/feeds/google-merchant.xml`, נבנה מ-`PRODUCTS`, revalidate שעתי.
Merchant API אופציונלי בעתיד לסנכרון נקודתי/CRM; אינו נדרש להשקה.

## 8. Rollback

- כל העבודה ב-branch `feature/google-merchant-center-automatic-sync`.
- Production הנוכחי לא נגע עד deploy מפורש.
- ביטול: `git checkout main` + `vercel --prod` מ-main → חוזר ל-`c5c2327`.
- קבצים שנוספו בלבד (feed/status/category-map) — אין שינוי בקוד קיים של מוצרים/מחירים/checkout.
