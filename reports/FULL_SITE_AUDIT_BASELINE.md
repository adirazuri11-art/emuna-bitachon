# FULL_SITE_AUDIT_BASELINE — אמונה וביטחון

- **Stack:** Next.js 14.2 (App Router), React 18, TS, Tailwind RTL, Vercel, Supabase Postgres + Prisma.
- **מקורות אמת:** מוצרים/קטגוריות = `lib/supplier-products.json` + `lib/catalog*.ts` (סטטי); חברי מועדון+קופונים = Supabase; מחירים = `retail(cost)` ב-`lib/catalog-supplier.ts`; משלוח = `lib/payments.ts`.
- **מה נבדק:** אינטגריטי קטלוג (779 מוצרים), אבטחה (secrets/headers), רגרסיה (מטפחות/יועץ), checkout+pricing, SEO infra (robots/sitemap), תמונות מוצר, security headers live, עמודי מפתח live.
- **baseline commit:** 0a53775 · branch: audit/full-site-pre-payment-readiness
