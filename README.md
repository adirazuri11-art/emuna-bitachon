# אמונה וביטחון — Emuna & Bitachon

פלטפורמת יודאיקה יוקרתית: Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Prisma/PostgreSQL · Vercel AI SDK (Claude) · Hebcal.

## הרצה מקומית

```bash
npm install
cp .env.example .env    # למלא מפתחות
npm run dev             # http://localhost:3000
```

## חיבור בסיס נתונים (Supabase / Postgres)

```bash
# למלא DATABASE_URL ב-.env, ואז:
npm run db:generate
npm run db:push
```

> לחיפוש הסמנטי נדרשת הרחבת `pgvector` (מובנית ב-Supabase: `create extension vector;`).

## מה מחובר למה

| יכולת | קובץ | דורש |
|---|---|---|
| דף בית דינמי לפי לוח עברי | `lib/hebcal.ts` | כלום — עובד מיד |
| היועץ ההלכתי (צ'אט AI) | `app/api/ai/assistant/route.ts` | `ANTHROPIC_API_KEY` |
| חיפוש סמנטי | `app/api/ai/search/route.ts` | DB + pgvector (יש fallback) |
| סנכרון ספקים B2B | `app/api/webhooks/suppliers/route.ts` | `SUPPLIER_WEBHOOK_SECRET` + DB |
