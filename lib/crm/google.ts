// ============================================================
// Google — REAL data via GA4 Data API + Search Console API. Server-only.
// Uses a service account (JWT signed with node:crypto — no external deps).
//
// Env (server-only, never client / never logged):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL        — xxx@yyy.iam.gserviceaccount.com
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  — the PEM private key ("\n" escaped is ok)
//   GA4_PROPERTY_ID                     — numeric GA4 property id (no "properties/")
//   GSC_SITE_URL                        — e.g. "sc-domain:emunavebitachon.co.il"
//
// Grant the service account: GA4 property "Viewer", and add it as a
// Search Console user (Settings → Users and permissions → Restricted).
// Everything is defensive: missing config / API error => configured:false.
// ============================================================

import 'server-only';
import { createSign } from 'crypto';

export interface SeriesPoint {
  date: string;
  count: number;
}
export interface LabeledCount {
  label: string;
  count: number;
}

export interface GoogleData {
  configured: boolean;
  error?: string;
  ga4?: {
    users30d: number;
    sessions30d: number;
    conversions30d: number;
    usersTrend: SeriesPoint[];
    topPages: LabeledCount[];
    topSources: LabeledCount[];
  };
  gsc?: {
    clicks: number;
    impressions: number;
    ctr: number; // 0..1
    position: number;
    clicksTrend: SeriesPoint[];
    topQueries: { label: string; clicks: number; impressions: number }[];
  };
}

function creds() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) return null;
  key = key.trim().replace(/^["']|["']$/g, ''); // הסרת גרשיים עוטפים
  key = key.replace(/\\n/g, '\n'); // \n מוברח → שורה אמיתית
  // חילוץ בלוק ה-PEM גם אם יש רעש מסביב
  const m = key.match(/-----BEGIN[\s\S]*?-----END[^-]*-----/);
  if (m) key = m[0];
  return { email, key };
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Cache access tokens per-scope in module memory (tokens live ~1h).
const tokenCache = new Map<string, { token: string; exp: number }>();

export async function getAccessToken(scope: string): Promise<string | null> {
  const c = creds();
  if (!c) return null;
  const cached = tokenCache.get(scope);
  if (cached && cached.exp - 60 > Date.now() / 1000) return cached.token;

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({ iss: c.email, scope, aud: 'https://oauth2.googleapis.com/token', iat, exp }),
  );
  const signingInput = `${header}.${claim}`;
  let signature: string;
  try {
    signature = b64url(createSign('RSA-SHA256').update(signingInput).sign(c.key));
  } catch {
    return null; // bad key
  }
  const assertion = `${signingInput}.${signature}`;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!j.access_token) return null;
    tokenCache.set(scope, { token: j.access_token, exp: iat + (j.expires_in ?? 3600) });
    return j.access_token;
  } catch {
    return null;
  }
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

async function fetchGA4(): Promise<GoogleData['ga4'] | undefined> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return undefined;
  const token = await getAccessToken('https://www.googleapis.com/auth/analytics.readonly');
  if (!token) return undefined;

  const run = async (body: object) => {
    try {
      const res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify(body),
          next: { revalidate: 600 },
        },
      );
      if (!res.ok) return null;
      return (await res.json()) as {
        rows?: Array<{ dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }>;
      };
    } catch {
      return null;
    }
  };

  const dateRange = { startDate: '30daysAgo', endDate: 'today' };

  const [totals, daily, pages, sources] = await Promise.all([
    run({
      dateRanges: [dateRange],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'conversions' }],
    }),
    run({
      dateRanges: [dateRange],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    run({
      dateRanges: [dateRange],
      dimensions: [{ name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 6,
    }),
    run({
      dateRanges: [dateRange],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 6,
    }),
  ]);

  if (!totals) return undefined;
  const t = totals.rows?.[0]?.metricValues ?? [];
  return {
    users30d: Number(t[0]?.value ?? 0),
    sessions30d: Number(t[1]?.value ?? 0),
    conversions30d: Math.round(Number(t[2]?.value ?? 0)),
    usersTrend: (daily?.rows ?? []).map((r) => ({
      date: `${r.dimensionValues?.[0]?.value?.slice(0, 4)}-${r.dimensionValues?.[0]?.value?.slice(4, 6)}-${r.dimensionValues?.[0]?.value?.slice(6, 8)}`,
      count: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    topPages: (pages?.rows ?? []).map((r) => ({
      label: r.dimensionValues?.[0]?.value ?? '',
      count: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    topSources: (sources?.rows ?? []).map((r) => ({
      label: r.dimensionValues?.[0]?.value ?? '',
      count: Number(r.metricValues?.[0]?.value ?? 0),
    })),
  };
}

async function fetchGSC(): Promise<GoogleData['gsc'] | undefined> {
  const site = process.env.GSC_SITE_URL;
  if (!site) return undefined;
  const token = await getAccessToken('https://www.googleapis.com/auth/webmasters.readonly');
  if (!token) return undefined;

  const endDate = ymd(new Date(Date.now() - 2 * 864e5)); // GSC lags ~2 days
  const startDate = ymd(new Date(Date.now() - 32 * 864e5));

  const query = async (body: object) => {
    try {
      const res = await fetch(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify(body),
          next: { revalidate: 600 },
        },
      );
      if (!res.ok) return null;
      return (await res.json()) as {
        rows?: Array<{ keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }>;
      };
    } catch {
      return null;
    }
  };

  const [totals, daily, queries] = await Promise.all([
    query({ startDate, endDate }),
    query({ startDate, endDate, dimensions: ['date'] }),
    query({ startDate, endDate, dimensions: ['query'], rowLimit: 8 }),
  ]);

  if (!totals) return undefined;
  const agg = totals.rows?.[0];
  return {
    clicks: Math.round(agg?.clicks ?? 0),
    impressions: Math.round(agg?.impressions ?? 0),
    ctr: agg?.ctr ?? 0,
    position: +(agg?.position ?? 0).toFixed(1),
    clicksTrend: (daily?.rows ?? []).map((r) => ({ date: r.keys?.[0] ?? '', count: Math.round(r.clicks) })),
    topQueries: (queries?.rows ?? []).map((r) => ({
      label: r.keys?.[0] ?? '',
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
    })),
  };
}

// אבחון מפורט — צורת המפתח, חתימת JWT, ותשובת נקודת הטוקן של גוגל.
export async function googleDiagnostic(): Promise<Record<string, unknown>> {
  const c = creds();
  if (!c) return { step: 'creds', ok: false, note: 'אין email/key' };
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '';
  const keyInfo = {
    length: c.key.length,
    startsWithBegin: c.key.startsWith('-----BEGIN'),
    endsWithEnd: c.key.trimEnd().endsWith('-----'),
    hasRealNewline: c.key.includes('\n'),
    emailEndsCorrect: c.email.endsWith('.iam.gserviceaccount.com'),
    rawHead: rawKey.slice(0, 45),
    rawContainsBegin: rawKey.includes('BEGIN'),
    afterHead: c.key.slice(0, 32),
  };
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: c.email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 }));
  const signingInput = `${header}.${claim}`;
  let signature: string;
  try {
    signature = b64url(createSign('RSA-SHA256').update(signingInput).sign(c.key));
  } catch (e) {
    return { step: 'sign', ok: false, keyInfo, error: e instanceof Error ? e.message : 'sign error' };
  }
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${signingInput}.${signature}` }),
      cache: 'no-store',
    });
    return { step: 'token', ok: res.ok, status: res.status, keyInfo, tokenBody: (await res.text()).slice(0, 300) };
  } catch (e) {
    return { step: 'token', ok: false, keyInfo, error: e instanceof Error ? e.message : 'fetch error' };
  }
}

// שליפת נכסי GA4 שחשבון-השירות רשאי לגשת אליהם (Admin API) — לגילוי ה-Property ID.
export async function discoverGa4Properties(): Promise<Record<string, unknown>> {
  const token = await getAccessToken('https://www.googleapis.com/auth/analytics.readonly');
  if (!token) return { ok: false, note: 'no token' };
  try {
    const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = (await res.json()) as { accountSummaries?: Array<{ propertySummaries?: Array<{ property?: string; displayName?: string }> }>; error?: unknown };
    const properties: Array<{ id: string; name: string }> = [];
    for (const acc of data.accountSummaries ?? []) {
      for (const p of acc.propertySummaries ?? []) {
        properties.push({ id: (p.property ?? '').replace('properties/', ''), name: p.displayName ?? '' });
      }
    }
    return { ok: res.ok, status: res.status, properties, rawIfEmpty: properties.length ? undefined : JSON.stringify(data).slice(0, 250) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' };
  }
}

export async function getGoogleData(): Promise<GoogleData> {
  if (!creds()) return { configured: false };
  const [ga4, gsc] = await Promise.all([fetchGA4(), fetchGSC()]);
  if (!ga4 && !gsc) return { configured: false, error: 'no_data' };
  return { configured: true, ga4, gsc };
}
