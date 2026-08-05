// ============================================================
// Merchant API — נתוני הצד של Google (סטטוס מוצרים, Diagnostics) ל-CRM.
// משתמש בחשבון-השירות הקיים (JWT) עם scope של Content API.
// עובד רק לאחר: (1) הפעלת Content API for Shopping ב-GCP,
// (2) הוספת חשבון-השירות כמשתמש ב-Merchant Center 5834922069.
// עד אז fetchMerchantDiagnostics מחזיר { connected:false } בחן.
// ============================================================
import { getAccessToken } from '@/lib/crm/google';

export const MERCHANT_ID = '5834922069';
const CONTENT_SCOPE = 'https://www.googleapis.com/auth/content';
const API = 'https://shoppingcontent.googleapis.com/content/v2.1';

// המייל של חשבון-השירות (מזהה לא-סודי) — להצגה בהוראות החיבור ב-CRM.
export function serviceAccountEmail(): string | null {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null;
}

interface DestinationStatus {
  destination?: string;
  status?: string; // approved | pending | disapproved
}
interface ItemLevelIssue {
  code?: string;
  servability?: string;
  resolution?: string;
  description?: string;
  detail?: string;
  numItems?: number;
}
interface ProductStatus {
  productId?: string;
  title?: string;
  destinationStatuses?: DestinationStatus[];
  itemLevelIssues?: ItemLevelIssue[];
}

export interface MerchantDiagnostics {
  connected: boolean;
  error?: string;
  merchantId: string;
  serviceAccount: string | null;
  totals: { total: number; approved: number; pending: number; disapproved: number };
  topIssues: { code: string; description: string; servability: string; numItems: number }[];
  sampleDisapproved: { productId: string; title: string; issue: string }[];
}

// destination הרלוונטי ל-Free Listings משתנה בין חשבונות: "SurfacesAcrossGoogle"
// (חדש) או "free_listings"/"FreeListings". מזהים לפי prefix כדי לא לפספס.
function isFreeListingDest(d?: string): boolean {
  if (!d) return false;
  const s = d.toLowerCase();
  return s.includes('surface') || s.includes('free');
}

export async function fetchMerchantDiagnostics(): Promise<MerchantDiagnostics> {
  const base: MerchantDiagnostics = {
    connected: false,
    merchantId: MERCHANT_ID,
    serviceAccount: serviceAccountEmail(),
    totals: { total: 0, approved: 0, pending: 0, disapproved: 0 },
    topIssues: [],
    sampleDisapproved: [],
  };

  const token = await getAccessToken(CONTENT_SCOPE);
  if (!token) return { ...base, error: 'no-token' };

  try {
    const statuses: ProductStatus[] = [];
    let pageToken: string | undefined;
    // עד ~1000 מוצרים (4 עמודים של 250) — הקטלוג הנוכחי 799.
    for (let page = 0; page < 6; page++) {
      const url =
        `${API}/${MERCHANT_ID}/productstatuses?maxResults=250` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!r.ok) {
        const body = await r.text().catch(() => '');
        return { ...base, error: r.status === 403 ? 'no-access' : `http-${r.status}: ${body.slice(0, 120)}` };
      }
      const j = (await r.json()) as { resources?: ProductStatus[]; nextPageToken?: string };
      if (Array.isArray(j.resources)) statuses.push(...j.resources);
      pageToken = j.nextPageToken;
      if (!pageToken) break;
    }

    const totals = { total: statuses.length, approved: 0, pending: 0, disapproved: 0 };
    const issueMap = new Map<string, { code: string; description: string; servability: string; numItems: number }>();
    const sampleDisapproved: MerchantDiagnostics['sampleDisapproved'] = [];

    for (const s of statuses) {
      const dest = (s.destinationStatuses ?? []).find((d) => isFreeListingDest(d.destination)) ?? s.destinationStatuses?.[0];
      const st = dest?.status;
      if (st === 'approved') totals.approved++;
      else if (st === 'disapproved') {
        totals.disapproved++;
        if (sampleDisapproved.length < 25) {
          const iss = s.itemLevelIssues?.find((i) => i.servability === 'disapproved') ?? s.itemLevelIssues?.[0];
          sampleDisapproved.push({ productId: s.productId ?? '—', title: s.title ?? '—', issue: iss?.description ?? '—' });
        }
      } else totals.pending++;

      for (const i of s.itemLevelIssues ?? []) {
        const key = i.code ?? i.description ?? 'unknown';
        const cur = issueMap.get(key) ?? { code: i.code ?? '—', description: i.description ?? '—', servability: i.servability ?? '—', numItems: 0 };
        cur.numItems += i.numItems ?? 1;
        issueMap.set(key, cur);
      }
    }

    const topIssues = Array.from(issueMap.values()).sort((a, b) => b.numItems - a.numItems).slice(0, 12);
    return { ...base, connected: true, totals, topIssues, sampleDisapproved };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : 'fetch-failed' };
  }
}
