# PAYMENT_INTEGRATION_READINESS — אמונה וביטחון

> נכתב לקראת חיבור הסליקה (Cardcom) מחר. מבוסס על בדיקת הקוד בפועל.
> **לא חובר Provider, לא בוצעה עסקה, לא נוצר Secret.**

## מצב נוכחי (מאומת בקוד)

- **Checkout** (`app/checkout/page.tsx`) הוא כרגע זרימת-ליד בצד-לקוח: הלקוח ממלא פרטים → נוצר "מסך אישור" בצד-לקוח (מספר הזמנה מקומי) → הפניה לוואטסאפ. **אין תשלום אמיתי.**
- **חישוב הסכום** מתבצע בצד-לקוח: `total = subtotal + shipping - couponDiscount` (שורה 54), מתוך עגלת Zustand.
- **`lib/payments.ts`** — `createPaymentPage()` הוא **stub (TODO)**, לא ממומש. קיים ממשק `PaymentProvider` מוכן.
- **מודל `Order`/`OrderItem`** קיים ב-Prisma אך **לא נכתב** ע"י שום flow.
- **משלוח** מחושב ב-`calcShipping()` (₪29, חינם מעל ₪399) — לוגיקה קיימת וניתנת לשימוש בצד-שרת.
- **קופון מועדון** נאכף בצד-שרת (`/api/coupons/redeem`, `redeemClubCoupon`), אך **נצרך היום לפני תשלום** (שורה 77).

## מה חובה לבנות מחר (בסדר)

1. **Server Action / API route** ליצירת הזמנה + סכום סמכותי:
   - מקבל את הסל, **מחשב מחדש בצד-שרת** את מחירי הפריטים (מתוך הקטלוג), המשלוח והקופון. **לעולם לא לסמוך על `total` מהלקוח.**
   - יוצר `Order` (Prisma) בסטטוס `PENDING` עם `orderNumber` ייחודי.
   - קורא ל-Cardcom LowProfile Create עם הסכום המחושב, ומחזיר `redirectUrl`.
2. **Webhook** לאישור תשלום (`/api/webhooks/cardcom`):
   - מאמת חתימה, **Idempotency לפי transaction/orderId**, מסמן `Order` כ-`PAID`.
   - **רק כאן:** מימוש קופון המועדון, ירידת מלאי, שליחת מייל אישור, וירי `purchase` בצד-שרת.
3. **הזזת מימוש הקופון** מ-submit (client) ל-webhook (server) — ISS-02.

## Environment Variables שיידרשו

- `CARDCOM_TERMINAL` (כבר בשימוש בקוד)
- `CARDCOM_API_NAME` (כבר בשימוש בקוד)
- `CARDCOM_API_PASSWORD` / API key (להוסיף — שרת בלבד)
- אין להכניס אף אחד מהם ל-`NEXT_PUBLIC_*` או ל-client bundle.

## URLs / Webhooks שיידרשו

- `successUrl`: `https://emunavebitachon.co.il/checkout/success?order={orderNumber}`
- `failureUrl`: `https://emunavebitachon.co.il/checkout/failed?order={orderNumber}`
- `cancelUrl`: `https://emunavebitachon.co.il/checkout`
- `webhookUrl`: `https://emunavebitachon.co.il/api/webhooks/cardcom` (חתום, Idempotent)
- Payload: `orderId, amount(שרת), currency=ILS, customerRef, success/failure/cancel/webhook URLs, idempotencyKey`

## בדיקות חובה מיד לאחר חיבור הסליקה (מחר)

- עסקת בדיקה בסביבת test של Cardcom (לא כרטיס אמיתי).
- ניסיון לשנות את הסכום מה-client → השרת **חייב** לדחות/להתעלם ולחייב את הסכום המחושב.
- כפילות webhook → הזמנה אחת בלבד (Idempotency).
- תשלום שנכשל/בוטל → אין הזמנה "שולמה", הקופון **לא** נצרך, `purchase` **לא** נורה.
- תשלום שהצליח → הזמנה PAID, קופון נצרך פעם אחת, מלאי יורד, `purchase` נורה פעם אחת עם הסכום הנכון.

## מוכנות

- **תשתית מוכנה:** ממשק `PaymentProvider`, `calcShipping`, אכיפת קופון בשרת, מודל Prisma Order, CSP/headers תקינים, אין דליפת secrets.
- **חסר (עבודת מחר):** מימוש `createPaymentPage`, server-side order+amount, webhook, הזזת מימוש קופון.
- **מסקנה:** ניתן לחבר סליקה מחר **ללא refactor רחב** — התוספות ממוקדות ואינן דורשות שינוי בקטלוג/עיצוב/סל.
