// ============================================================
// Meta (Instagram + Facebook) — REAL data via Graph API.
// Server-only. Reads credentials from env (never client, never logged):
//   META_PAGE_ACCESS_TOKEN  — long-lived Page access token
//   META_IG_USER_ID         — Instagram Business/Creator account id
//   META_PAGE_ID            — Facebook Page id
// Everything is defensive: missing config / API error => { configured:false }.
// ============================================================

import 'server-only';

const GRAPH = 'https://graph.facebook.com/v21.0';

export interface IgPost {
  id: string;
  caption: string;
  likeCount: number;
  commentsCount: number;
  mediaUrl: string | null;
  permalink: string;
  timestamp: string;
}

export interface SocialData {
  configured: boolean;
  error?: string;
  instagram?: {
    username: string;
    followers: number;
    following: number;
    mediaCount: number;
    recentPosts: IgPost[];
  };
  facebook?: {
    name: string;
    fans: number;
    followers: number;
    reachWeek: number | null;
  };
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

export async function getSocialData(): Promise<SocialData> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const igId = process.env.META_IG_USER_ID;
  const pageId = process.env.META_PAGE_ID;
  if (!token || (!igId && !pageId)) return { configured: false };

  const out: SocialData = { configured: true };

  // ---- Instagram ----
  if (igId) {
    const profile = await gql<{
      username?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
    }>(igId, { fields: 'username,followers_count,follows_count,media_count' }, token);
    const media = await gql<{ data?: Array<Record<string, unknown>> }>(
      `${igId}/media`,
      { fields: 'caption,like_count,comments_count,media_url,thumbnail_url,permalink,timestamp', limit: '6' },
      token,
    );
    if (profile) {
      out.instagram = {
        username: profile.username ?? '',
        followers: profile.followers_count ?? 0,
        following: profile.follows_count ?? 0,
        mediaCount: profile.media_count ?? 0,
        recentPosts: (media?.data ?? []).map((m) => ({
          id: String(m.id ?? ''),
          caption: String(m.caption ?? '').slice(0, 120),
          likeCount: Number(m.like_count ?? 0),
          commentsCount: Number(m.comments_count ?? 0),
          mediaUrl: (m.media_url as string) ?? (m.thumbnail_url as string) ?? null,
          permalink: String(m.permalink ?? ''),
          timestamp: String(m.timestamp ?? ''),
        })),
      };
    }
  }

  // ---- Facebook Page ----
  if (pageId) {
    const page = await gql<{ name?: string; fan_count?: number; followers_count?: number }>(
      pageId,
      { fields: 'name,fan_count,followers_count' },
      token,
    );
    const insights = await gql<{ data?: Array<{ values?: Array<{ value?: number }> }> }>(
      `${pageId}/insights/page_impressions_unique`,
      { period: 'week' },
      token,
    );
    if (page) {
      out.facebook = {
        name: page.name ?? '',
        fans: page.fan_count ?? 0,
        followers: page.followers_count ?? 0,
        reachWeek: insights?.data?.[0]?.values?.slice(-1)?.[0]?.value ?? null,
      };
    }
  }

  if (!out.instagram && !out.facebook) return { configured: false, error: 'no_data' };
  return out;
}
