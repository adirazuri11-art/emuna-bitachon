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
  const sb = supa();
  if (!sb) return empty;

  // Pull a bounded recent window and aggregate in-process (simple + safe).
  const { data, error } = await sb
    .from('gift_finder_sessions')
    .select('occasion, recommended_categories, clicked_product_ids, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error || !data) return empty; // table missing / not migrated yet

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
