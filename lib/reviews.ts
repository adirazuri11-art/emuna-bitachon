// ============================================================
// ביקורות מוצר — Neon/Postgres דרך Prisma raw (server-only).
// מנוהלות במלואן בתוך ה-CRM: כל ביקורת עוברת מודרציה (pending → approved/rejected).
// רק approved מוצג בעמוד המוצר ונספר ב-aggregateRating (בלי לזייף — Google מעניש).
// טבלת public.product_reviews נוצרת דרך /api/admin/migrate.
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productSlug: string;
  productId: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  email: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export interface ReviewStats {
  count: number;
  avg: number; // מעוגל לעשירית
}

interface RawRow {
  id: string;
  product_slug: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  email: string | null;
  status: ReviewStatus;
  created_at: Date | string;
}

const map = (r: RawRow): Review => ({
  id: r.id,
  productSlug: r.product_slug,
  productId: r.product_id,
  authorName: r.author_name,
  rating: Number(r.rating),
  title: r.title,
  body: r.body,
  email: r.email,
  status: r.status,
  createdAt: new Date(r.created_at).toISOString(),
});

export interface NewReview {
  productSlug: string;
  productId?: string | null;
  authorName: string;
  rating: number;
  title?: string | null;
  body: string;
  email?: string | null;
}

// שמירת ביקורת חדשה — נכנסת כ-pending (ממתינה לאישור ב-CRM).
export async function createReview(r: NewReview): Promise<{ ok: boolean; error?: string }> {
  const rating = Math.round(Number(r.rating));
  if (!r.productSlug || !r.authorName?.trim() || !r.body?.trim()) return { ok: false, error: 'missing' };
  if (!(rating >= 1 && rating <= 5)) return { ok: false, error: 'rating' };
  try {
    await prisma.$executeRawUnsafe(
      `insert into public.product_reviews (product_slug, product_id, author_name, rating, title, body, email)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      r.productSlug,
      r.productId ?? null,
      r.authorName.trim().slice(0, 80),
      rating,
      (r.title ?? '').trim().slice(0, 120) || null,
      r.body.trim().slice(0, 2000),
      (r.email ?? '').trim().slice(0, 160) || null,
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 80) : 'db' };
  }
}

// ביקורות מאושרות למוצר (לתצוגה בעמוד המוצר).
export async function getApprovedReviews(productSlug: string, limit = 50): Promise<Review[]> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select * from public.product_reviews where product_slug=$1 and status='approved' order by created_at desc limit $2`,
      productSlug,
      limit,
    )) as RawRow[];
    return rows.map(map);
  } catch {
    return [];
  }
}

// סטטיסטיקת דירוג (מאושרות בלבד) — מזין כוכבים + aggregateRating.
export async function getReviewStats(productSlug: string): Promise<ReviewStats> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select count(*)::int as count, coalesce(avg(rating),0)::float as avg
       from public.product_reviews where product_slug=$1 and status='approved'`,
      productSlug,
    )) as Array<{ count: number; avg: number }>;
    const r = rows[0] ?? { count: 0, avg: 0 };
    return { count: Number(r.count), avg: Math.round(Number(r.avg) * 10) / 10 };
  } catch {
    return { count: 0, avg: 0 };
  }
}

// ---------- CRM (מודרציה) ----------

export async function listReviews(status?: ReviewStatus, limit = 200): Promise<Review[]> {
  try {
    const rows = status
      ? ((await prisma.$queryRawUnsafe(
          `select * from public.product_reviews where status=$1 order by created_at desc limit $2`,
          status,
          limit,
        )) as RawRow[])
      : ((await prisma.$queryRawUnsafe(
          `select * from public.product_reviews order by created_at desc limit $1`,
          limit,
        )) as RawRow[]);
    return rows.map(map);
  } catch {
    return [];
  }
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<boolean> {
  try {
    const n = await prisma.$executeRawUnsafe(
      `update public.product_reviews set status=$1 where id=$2::uuid`,
      status,
      id,
    );
    return Number(n) > 0;
  } catch {
    return false;
  }
}

export interface ReviewsOverview {
  pending: number;
  approved: number;
  rejected: number;
  avgApproved: number;
}

export async function getReviewsOverview(): Promise<ReviewsOverview> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select status, count(*)::int as n, coalesce(avg(rating),0)::float as avg
       from public.product_reviews group by status`,
    )) as Array<{ status: ReviewStatus; n: number; avg: number }>;
    const by: Record<string, { n: number; avg: number }> = {};
    for (const r of rows) by[r.status] = { n: Number(r.n), avg: Number(r.avg) };
    return {
      pending: by.pending?.n ?? 0,
      approved: by.approved?.n ?? 0,
      rejected: by.rejected?.n ?? 0,
      avgApproved: by.approved ? Math.round(by.approved.avg * 10) / 10 : 0,
    };
  } catch {
    return { pending: 0, approved: 0, rejected: 0, avgApproved: 0 };
  }
}
