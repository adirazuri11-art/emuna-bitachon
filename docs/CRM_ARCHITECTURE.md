# CRM_ARCHITECTURE — אמונה וביטחון (הצעה, Phase 1)

> מבוסס על ממצאי `CRM_SYSTEM_AUDIT.md`. זו הצעה לאישור — לא נבנתה עדיין.

---

## 1. עקרונות-על (מתוך הדרישות)

1. האתר החי הוא מקור אמת למוצרים/הזמנות/מחירים/מלאי/סליקה — CRM read-only בתחילה.
2. כשל ב-CRM/AI/Google לעולם לא מפיל ולא מעכב את האתר.
3. אין נתוני Mock ב-Production. דשבורד נבנה רק מעל דאטה אמיתי.
4. AI ניגש לדאטה דרך **Tools מאובטחים בלבד** — לא SQL חופשי, לא גישה ישירה ל-DB, לא סודות.
5. כל פעולה רגישה = Approval + Audit + Rollback. AI לא כותב ל-Production לבד.

---

## 2. טופולוגיה מומלצת

```
┌────────────────────┐        webhooks/events (async, signed)        ┌────────────────────┐
│   האתר (Vercel)     │ ────────────────────────────────────────────▶│   CRM (אפליקציה     │
│  Next.js storefront │                                               │   נפרדת ומאובטחת)   │
│  — ללא שינוי לוגיקה  │◀──── read-only APIs (club/coupons/catalog) ───│  Next.js + RBAC     │
└─────────┬──────────┘                                               └─────────┬──────────┘
          │                                                                     │
          ▼                                                                     ▼
   Supabase Postgres  ◀───────── schema משותף/נפרד ל-CRM ───────────▶  Prisma (CRM)
   (ClubMember, coupons,                                              (crm_* tables:
    + טבלאות חדשות: orders,                                            users/roles/tasks/
    gift_finder_sessions, events)                                     tickets/audit/ai_*)
          ▲                                                                     │
          │                                                                     ▼
   GA4 / GSC / Gmail / Calendar / Ads  ◀──── OAuth 2.0 (tokens מוצפנים) ──── Integration Center
```

## 3. Trust boundaries

- **Client (דפדפן):** אף פעם לא מחזיק service-role key, Google tokens, או סודות. UI בלבד.
- **CRM server:** מחזיק סודות ב-env/secret-manager מוצפן. אוכף RBAC לפני כל query.
- **AI layer:** מקבל רק tools עם input/output schema (Zod) + הרשאת המשתמש. לא רואה סודות, לא מריץ SQL גולמי.
- **Website ↔ CRM:** webhooks חתומים (HMAC) + idempotencyKey; retry+DLQ; כשל לא חוזר לאתר.

## 4. זרימות (תמצית)

- **Auth flow:** login → session (httpOnly cookie) → RBAC middleware → resource. MFA לכשתהיה תשתית.
- **Webhook flow:** site event → sign(HMAC) → CRM `/ingest` → verify+dedupe(idempotencyKey) → queue → handler → persist → audit. כשל → retry(backoff) → DLQ → replay ידני.
- **AI flow:** user prompt → planner → allowed tool(s) → tool עם RBAC+schema → תוצאה עם מקור+תקופה+confidence → פעולה רגישה? → Approval → Audit.
- **Google flow:** Owner/Admin מבצע OAuth consent → refresh token מוצפן at-rest → sync job מתוזמן → תצוגה. Disconnect מוחק token.
- **Rollback flow:** כל migration עם down; feature flags; deploy עם revert; write-to-site תמיד עם snapshot לפני.

## 5. Data model — פיצול

- **קיים ב-Supabase (לא נוגעים):** `ClubMember`, `coupons`.
- **חדש באתר (Phase 2, אדיטיבי):** `orders`, `order_items`, `customers`, `gift_finder_sessions`, `web_events` — נכתבים אסינכרונית, source of truth תפעולי.
- **חדש ב-CRM (Phase 3+):** `crm_users`, `roles`, `permissions`, `tasks`, `tickets`, `conversations`, `segments`, `automations`, `automation_runs`, `audit_logs`, `ai_conversations`, `ai_actions`, `ai_approvals`, `oauth_connections`, `webhook_events`, `sync_jobs`.
- כל הלוגיקה על מזהים יציבים (`productId`/`slug`/`categoryId`/`orderId`/`externalId`) — **לא** על שם עברי (למשל לא "מטפחות").

## 6. אבטחה (תמצית — הרחבה ב-CRM_SECURITY_MODEL בהמשך)

TLS · encryption-at-rest · secrets ב-secret-manager (לא בקוד/Git/client) · RBAC · Audit על כל פעולה · rate-limit · input validation (Zod) · secure headers · אין שמירת PAN/CVV/סיסמאות · tokens מוצפנים · consent+opt-out+frequency-cap לכל תקשורת יוצאת.

## 7. מה שנדרש מאדיר לפני Phase 2 (החלטות + גישות)

מפורט בהודעת הצ'אט. בתמצית: מיקום/DB, תקציב (Vercel/Supabase/AI/WhatsApp/email), חשבון Google Cloud ל-OAuth, וסדר עדיפויות ל-Phase 2.
