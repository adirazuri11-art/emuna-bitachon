// ============================================================
// Meta (Instagram + Facebook) — REAL data via Graph API. Server-only.
//
// Token resolution order (so the token can self-heal & auto-refresh):
//   1. Supabase table `meta_config` (single row) — written by the refresh cron.
//   2. Env vars — the initial seed / simplest setup.
//
// Env (server-only, never client / never logged):
//   META_PAGE_ACCESS_TOKEN  — long-lived Page (or System-User) access token
//   META_IG_USER_ID         — Instagram Business/Creator account id
//   META_PAGE_ID            — Facebook Page id
//   META_APP_ID / META_APP_SECRET — only needed for auto-refresh + token health
//
// Everything is defensive: missing config / API error => configured:false.
// ============================================================

import 'server-only';
import { createClient } from '@supabase/supabase-js';

const GRAPH = 'https://graph.facebook.com/v21.0';

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface MetaConfig {
  token?: string;
  igId?: string;
  pageId?: string;
  expiresAt?: number | null; // unix seconds; 0/null => never expires
  source: 'supabase' | 'env' | 'none';
}

// Reads the freshest credentials: Supabase row wins, env is the fallback seed.
export async function loadMetaConfig(): Promise<MetaConfig> {
  const sb = supa();
  if (sb) {
    try {
      const { data } = await sb
        .from('meta_config')
        .select('access_token, ig_user_id, page_id, token_expires_at')
        .limit(1)
        .maybeSingle();
      if (data?.access_token) {
        return {
          token: data.access_token,
          igId: data.ig_user_id ?? process.env.META_IG_USER_ID,
          pageId: data.page_id ?? process.env.META_PAGE_ID,
          expiresAt: data.token_expires_at ? Math.floor(new Date(data.token_expires_at).getTime() / 1000) : null,
          source: 'supabase',
        };
      }
    } catch {
      /* table missing / not migrated yet → fall through to env */
    }
  }
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (token) {
    return {
      token,
      igId: process.env.META_IG_USER_ID,
      pageId: process.env.META_PAGE_ID,
      expiresAt: null,
      source: 'env',
    };
  }
  return { source: 'none' };
}

async function gql<T>(path: string, params: Record<string, string>, token: string): Promise<T | null> {
  const url = `${GRAPH}/${path}?${new URLSearchParams({ ...params, access_token: token })}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------- Types ----------
export interface IgPost {
  id: string;
  caption: string;
  likeCount: number;
  commentsCount: number;
  mediaUrl: string | null;
  permalink: string;
  timestamp: string;
}

export interface SeriesPoint {
  date: string;
  count: number;
}

export interface SocialData {
  configured: boolean;
  error?: string;
  token: { expiresAt: number | null; neverExpires: boolean; source: MetaConfig['source'] };
  instagram?: {
    username: string;
    followers: number;
    following: number;
    mediaCount: number;
    engagementRate: number; // % over recent posts
    recentPosts: IgPost[];
  };
  facebook?: {
    name: string;
    fans: number;
    followers: number;
    reachWeek: number | null;
  };
  insights: {
    igReach: SeriesPoint[];
    igFollowerGrowth: SeriesPoint[];
    fbImpressions: SeriesPoint[];
    fbEngagement: SeriesPoint[];
  };
}

// Convert a Graph insight metric block -> daily SeriesPoint[].
function metricSeries(
  payload: { data?: Array<{ name?: string; values?: Array<{ end_time?: string; value?: number }> }> } | null,
  name: string,
): SeriesPoint[] {
  const block = payload?.data?.find((d) => d.name === name);
  if (!block?.values) return [];
  return block.values.map((v) => ({
    date: (v.end_time ?? '').slice(0, 10),
    count: Number(v.value ?? 0),
  }));
}

const unix = (d: Date) => Math.floor(d.getTime() / 1000).toString();

export async function getSocialData(): Promise<SocialData> {
  const cfg = await loadMetaConfig();
  const tokenInfo = {
    expiresAt: cfg.expiresAt ?? null,
    neverExpires: !cfg.expiresAt,
    source: cfg.source,
  };
  const empty: SocialData['insights'] = { igReach: [], igFollowerGrowth: [], fbImpressions: [], fbEngagement: [] };

  if (!cfg.token || (!cfg.igId && !cfg.pageId)) {
    return { configured: false, token: tokenInfo, insights: empty };
  }
  const token = cfg.token;
  const out: SocialData = { configured: true, token: tokenInfo, insights: empty };

  const until = new Date();
  const since = new Date(Date.now() - 30 * 864e5);

  // Auto-resolve the Instagram Business account id from the page (so the user
  // never has to supply META_IG_USER_ID — only the page token is needed).
  let igId = cfg.igId;
  if (!igId && cfg.pageId) {
    const linked = await gql<{ instagram_business_account?: { id?: string } }>(
      cfg.pageId,
      { fields: 'instagram_business_account' },
      token,
    );
    igId = linked?.instagram_business_account?.id;
  }

  // ---- Instagram ----
  if (igId) {
    const [profile, media, reach, follows] = await Promise.all([
      gql<{ username?: string; followers_count?: number; follows_count?: number; media_count?: number }>(
        igId,
        { fields: 'username,followers_count,follows_count,media_count' },
        token,
      ),
      gql<{ data?: Array<Record<string, unknown>> }>(
        `${igId}/media`,
        { fields: 'caption,like_count,comments_count,media_url,thumbnail_url,permalink,timestamp', limit: '9' },
        token,
      ),
      gql<Parameters<typeof metricSeries>[0]>(
        `${igId}/insights`,
        { metric: 'reach', period: 'day', since: unix(since), until: unix(until) },
        token,
      ),
      gql<Parameters<typeof metricSeries>[0]>(
        `${igId}/insights`,
        { metric: 'follower_count', period: 'day', since: unix(since), until: unix(until) },
        token,
      ),
    ]);
    if (profile) {
      const posts: IgPost[] = (media?.data ?? []).map((m) => ({
        id: String(m.id ?? ''),
        caption: String(m.caption ?? '').slice(0, 140),
        likeCount: Number(m.like_count ?? 0),
        commentsCount: Number(m.comments_count ?? 0),
        mediaUrl: (m.media_url as string) ?? (m.thumbnail_url as string) ?? null,
        permalink: String(m.permalink ?? ''),
        timestamp: String(m.timestamp ?? ''),
      }));
      const followers = profile.followers_count ?? 0;
      const avgEng = posts.length
        ? posts.reduce((s, p) => s + p.likeCount + p.commentsCount, 0) / posts.length
        : 0;
      out.instagram = {
        username: profile.username ?? '',
        followers,
        following: profile.follows_count ?? 0,
        mediaCount: profile.media_count ?? 0,
        engagementRate: followers ? +((avgEng / followers) * 100).toFixed(2) : 0,
        recentPosts: posts,
      };
    }
    out.insights.igReach = metricSeries(reach, 'reach');
    out.insights.igFollowerGrowth = metricSeries(follows, 'follower_count');
  }

  // ---- Facebook Page ----
  if (cfg.pageId) {
    const [page, weekReach, impr, eng] = await Promise.all([
      gql<{ name?: string; fan_count?: number; followers_count?: number }>(
        cfg.pageId,
        { fields: 'name,fan_count,followers_count' },
        token,
      ),
      gql<Parameters<typeof metricSeries>[0]>(
        `${cfg.pageId}/insights/page_impressions_unique`,
        { period: 'week' },
        token,
      ),
      gql<Parameters<typeof metricSeries>[0]>(
        `${cfg.pageId}/insights`,
        { metric: 'page_impressions_unique', period: 'day', since: unix(since), until: unix(until) },
        token,
      ),
      gql<Parameters<typeof metricSeries>[0]>(
        `${cfg.pageId}/insights`,
        { metric: 'page_post_engagements', period: 'day', since: unix(since), until: unix(until) },
        token,
      ),
    ]);
    if (page) {
      const wr = metricSeries(weekReach, 'page_impressions_unique');
      out.facebook = {
        name: page.name ?? '',
        fans: page.fan_count ?? 0,
        followers: page.followers_count ?? 0,
        reachWeek: wr.length ? wr[wr.length - 1].count : null,
      };
    }
    out.insights.fbImpressions = metricSeries(impr, 'page_impressions_unique');
    out.insights.fbEngagement = metricSeries(eng, 'page_post_engagements');
  }

  if (!out.instagram && !out.facebook) {
    return { configured: false, error: 'no_data', token: tokenInfo, insights: empty };
  }
  return out;
}

// ---------- Token health (debug_token) ----------
export interface TokenHealth {
  known: boolean;
  valid: boolean;
  neverExpires: boolean;
  expiresAt: number | null; // unix seconds
  daysLeft: number | null;
  scopes: string[];
}

export async function getTokenHealth(): Promise<TokenHealth> {
  const cfg = await loadMetaConfig();
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const none: TokenHealth = { known: false, valid: false, neverExpires: false, expiresAt: null, daysLeft: null, scopes: [] };
  if (!cfg.token || !appId || !appSecret) return none;
  const res = await gql<{ data?: { is_valid?: boolean; expires_at?: number; scopes?: string[] } }>(
    'debug_token',
    { input_token: cfg.token },
    `${appId}|${appSecret}`,
  );
  const d = res?.data;
  if (!d) return none;
  const exp = d.expires_at ?? 0;
  return {
    known: true,
    valid: !!d.is_valid,
    neverExpires: exp === 0,
    expiresAt: exp === 0 ? null : exp,
    daysLeft: exp === 0 ? null : Math.round((exp * 1000 - Date.now()) / 864e5),
    scopes: d.scopes ?? [],
  };
}

// ---------- Auto-refresh (called by cron) ----------
// Extends the long-lived token and persists it to Supabase so the site always
// holds a fresh token without any manual step. Requires META_APP_ID/SECRET.
export async function refreshLongLivedToken(): Promise<{ ok: boolean; message: string; expiresAt?: number }> {
  const cfg = await loadMetaConfig();
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!cfg.token) return { ok: false, message: 'no_token' };
  if (!appId || !appSecret) return { ok: false, message: 'missing_app_credentials' };

  const health = await getTokenHealth();
  if (health.neverExpires) return { ok: true, message: 'permanent_token_no_refresh_needed' };

  const exchanged = await gql<{ access_token?: string; expires_in?: number }>(
    'oauth/access_token',
    { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: cfg.token },
    cfg.token,
  );
  if (!exchanged?.access_token) return { ok: false, message: 'exchange_failed' };

  const expiresAt = exchanged.expires_in ? Date.now() + exchanged.expires_in * 1000 : null;
  const sb = supa();
  if (!sb) return { ok: false, message: 'no_supabase' };
  const { error } = await sb.from('meta_config').upsert({
    id: 1,
    access_token: exchanged.access_token,
    ig_user_id: cfg.igId ?? null,
    page_id: cfg.pageId ?? null,
    token_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: 'persist_failed' };
  return { ok: true, message: 'refreshed', expiresAt: expiresAt ? Math.floor(expiresAt / 1000) : undefined };
}
