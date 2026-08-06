// ============================================================
// Proxy לתמונת מוצר מ-ART Judaica (לקוח מורשה). ⚠️ פנימי ל-CRM בלבד.
// כתובת ART: israel-judaica.com/big/<מספר>.jpg (הקוד ללא "UK"), דורש Referer.
// מושך on-demand + cache. fallback: webp → jpg → 404. אינו חוסם, אינו נוגע באתר.
// ============================================================

import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
const ART = 'https://www.israel-judaica.com';
const REF = 'https://www.israel-judaica.com/';

export async function GET(_req: NextRequest, { params }: { params: { sku: string } }) {
  const digits = decodeURIComponent(params.sku || '').replace(/\D/g, ''); // "UK81668" → "81668"
  if (!digits) return new Response(null, { status: 404 });

  for (const [path, type] of [[`webp/${digits}.webp`, 'image/webp'], [`big/${digits}.jpg`, 'image/jpeg']] as const) {
    try {
      // ⚠️ בלי query string — ART מחזיר 302→HTML כשיש ?param. הכתובת הנקייה מחזירה את התמונה.
      const r = await fetch(`${ART}/${path}`, { headers: { Referer: REF, 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow', cache: 'no-store' });
      const ct = r.headers.get('content-type') || '';
      if (r.ok && ct.startsWith('image')) {
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 500) {
          return new Response(buf, {
            headers: { 'content-type': type, 'cache-control': 'public, max-age=604800, s-maxage=604800, immutable' },
          });
        }
      }
    } catch { /* try next */ }
  }
  return new Response(null, { status: 404 });
}
