// ============================================================
// CRM data layer (server-only). Reads REAL data — no mock, no invented rows.
// Every reader is defensive: if a table/env is missing it returns zeros/empty
// so the dashboard degrades gracefully instead of crashing.
// ============================================================

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ---------- Club members (Prisma / Supabase — real) ----------
export interface ClubStats {
  total: number;
  usedCoupon: number;
  activeCoupon: number;
  joined30d: number;
  ok: boolean;
}

export async function getClubStats(): Promise<ClubStats> {
  try {
    const now = new Date();
    const [total, usedCoupon, activeCoupon, joined30d] = await Promise.all([
      prisma.clubMember.count(),
      prisma.clubMember.count({ where: { couponUsed: true } }),
      prisma.clubMember.count({ where: { couponUsed: false, couponExpires: { gt: now } } }),
      prisma.clubMember.count({ where: { createdAt: { gt: daysAgo(30) } } }),
    ]);
    return { total, usedCoupon, activeCoupon, joined30d, ok: true };
  } catch {
    return { total: 0, usedCoupon: 0, activeCoupon: 0, joined30d: 0, ok: false };
  }
}

export interface ClubMemberRow {
  email: string;
  couponCode: string;
  couponUsed: boolean;
  couponExpires: string;
  createdAt: string;
}

export async function getRecentClubMembers(limit = 25): Promise<ClubMemberRow[]> {
  try {
    const rows = await prisma.clubMember.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((m) => ({
      email: m.email,
      couponCode: m.couponCode,
      couponUsed: m.couponUsed,
      couponExpires: m.couponExpires.toISOString(),
      createdAt: m.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

// ---------- Customers (club members = real customers) ----------
export interface CustomerRow extends ClubMemberRow {
  couponUsedAt: string | null;
  status: 'used' | 'active' | 'expired';
  daysSinceJoin: number;
}

const dayDiff = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

function memberStatus(m: { couponUsed: boolean; couponExpires: Date }): CustomerRow['status'] {
  if (m.couponUsed) return 'used';
  if (m.couponExpires.getTime() < Date.now()) return 'expired';
  return 'active';
}

export async function getAllCustomers(search = '', limit = 200): Promise<CustomerRow[]> {
  try {
    const q = search.trim();
    const rows = await prisma.clubMember.findMany({
      where: q
        ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { couponCode: { contains: q, mode: 'insensitive' } }] }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((m) => ({
      email: m.email,
      couponCode: m.couponCode,
      couponUsed: m.couponUsed,
      couponUsedAt: m.couponUsedAt ? m.couponUsedAt.toISOString() : null,
      couponExpires: m.couponExpires.toISOString(),
      createdAt: m.createdAt.toISOString(),
      status: memberStatus(m),
      daysSinceJoin: dayDiff(m.createdAt.toISOString()),
    }));
  } catch {
    return [];
  }
}

export interface CustomerTimelineEvent {
  date: string;
  title: string;
  kind: 'join' | 'coupon' | 'note';
}

export async function getCustomer(email: string): Promise<{
  customer: CustomerRow | null;
  timeline: CustomerTimelineEvent[];
}> {
  try {
    const m = await prisma.clubMember.findUnique({ where: { email } });
    if (!m) return { customer: null, timeline: [] };
    const customer: CustomerRow = {
      email: m.email,
      couponCode: m.couponCode,
      couponUsed: m.couponUsed,
      couponUsedAt: m.couponUsedAt ? m.couponUsedAt.toISOString() : null,
      couponExpires: m.couponExpires.toISOString(),
      createdAt: m.createdAt.toISOString(),
      status: memberStatus(m),
      daysSinceJoin: dayDiff(m.createdAt.toISOString()),
    };
    const timeline: CustomerTimelineEvent[] = [
      { date: customer.createdAt, title: 'הצטרפ/ה למועדון וקיבל/ה קוד הטבה אישי', kind: 'join' },
    ];
    if (customer.couponUsedAt) {
      timeline.push({ date: customer.couponUsedAt, title: 'מימש/ה את קוד ההטבה', kind: 'coupon' });
    }
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { customer, timeline };
  } catch {
    return { customer: null, timeline: [] };
  }
}

// ---------- Gift Finder analytics (new table — real once instrumented) ----------
export interface GiftFinderStats {
  tableReady: boolean;
  total: number;
  last30d: number;
  withClick: number;
  clickRate: number; // 0..1
  topOccasions: { label: string; count: number }[];
  topCategories: { label: string; count: number }[];
}

export async function getGiftFinderStats(): Promise<GiftFinderStats> {
  const empty: GiftFinderStats = {
    tableReady: false,
    total: 0,
    last30d: 0,
    withClick: 0,
    clickRate: 0,
    topOccasions: [],
    topCategories: [],
  };
  // Pull a bounded recent window from Neon (Prisma raw) and aggregate in-process.
  let data: Array<{
    occasion: string | null;
    recommended_categories: string[] | null;
    clicked_product_ids: string[] | null;
    created_at: string;
  }>;
  try {
    data = (await prisma.$queryRawUnsafe(
      `select occasion, recommended_categories, clicked_product_ids, created_at
       from public.gift_finder_sessions order by created_at desc limit 2000`,
    )) as typeof data;
  } catch {
    return empty; // table missing / not migrated yet
  }
  if (!data) return empty;

  const cutoff = daysAgo(30).getTime();
  let last30d = 0;
  let withClick = 0;
  const occ: Record<string, number> = {};
  const cat: Record<string, number> = {};

  for (const r of data as Array<{
    occasion: string | null;
    recommended_categories: string[] | null;
    clicked_product_ids: string[] | null;
    created_at: string;
  }>) {
    if (new Date(r.created_at).getTime() >= cutoff) last30d++;
    if ((r.clicked_product_ids?.length ?? 0) > 0) withClick++;
    if (r.occasion) occ[r.occasion] = (occ[r.occasion] ?? 0) + 1;
    for (const c of r.recommended_categories ?? []) cat[c] = (cat[c] ?? 0) + 1;
  }

  const top = (m: Record<string, number>) =>
    Object.entries(m)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

  const total = data.length;
  return {
    tableReady: true,
    total,
    last30d,
    withClick,
    clickRate: total ? withClick / total : 0,
    topOccasions: top(occ),
    topCategories: top(cat),
  };
}

// ---------- Signup trend (real, 30d) ----------
export interface TrendPoint {
  date: string; // ISO day
  count: number;
}

export async function getSignupTrend(days = 30): Promise<TrendPoint[]> {
  const start = daysAgo(days - 1);
  start.setHours(0, 0, 0, 0);
  // Seed all days with 0 so the chart is continuous.
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  try {
    const rows = await prisma.clubMember.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    });
    for (const r of rows) {
      const k = r.createdAt.toISOString().slice(0, 10);
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
  } catch {
    /* return zero-seeded series */
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

// ---------- Aggregated, non-PII snapshot for the AI Copilot ----------
export async function getCrmContext() {
  const [club, gift, coupons] = await Promise.all([
    getClubStats(),
    getGiftFinderStats(),
    getCouponStats(),
  ]);
  return {
    asOf: new Date().toISOString(),
    clubMembers: {
      total: club.total,
      joinedLast30d: club.joined30d,
      couponUsed: club.usedCoupon,
      couponActive: club.activeCoupon,
    },
    coupons: coupons.tableReady ? { total: coupons.total, used: coupons.used } : null,
    giftFinder: gift.tableReady
      ? {
          totalSessions: gift.total,
          last30d: gift.last30d,
          clickRatePct: Math.round(gift.clickRate * 100),
          topOccasions: gift.topOccasions,
          topCategories: gift.topCategories,
        }
      : null,
    notes: gift.tableReady ? undefined : 'Gift Finder analytics not yet enabled (migration 001 pending).',
  };
}

// ---------- Coupons (Supabase — real, defensive) ----------
export interface CouponStats {
  tableReady: boolean;
  total: number;
  used: number;
}

export async function getCouponStats(): Promise<CouponStats> {
  const sb = supa();
  if (!sb) return { tableReady: false, total: 0, used: 0 };
  const { count, error } = await sb
    .from('coupons')
    .select('*', { count: 'exact', head: true });
  if (error) return { tableReady: false, total: 0, used: 0 };
  const { count: usedCount } = await sb
    .from('coupons')
    .select('*', { count: 'exact', head: true })
    .eq('used', true);
  return { tableReady: true, total: count ?? 0, used: usedCount ?? 0 };
}
