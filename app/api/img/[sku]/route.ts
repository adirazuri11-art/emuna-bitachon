// ============================================================
// GET /api/img/[sku] — proxy תמונות מוצר דרך הדומיין שלנו.
// למה: תמונות הספק (israel-judaica.com) מקושרות ב-hotlink; כש-Googlebot מושך
// 568 תמונות במהירות הוא מוגבל (throttling) ⇒ "Unable to show image".
// כאן אנחנו מושכים פעם אחת (server-side, עם Referer), מזרימים, ו-cache שנה
// ⇒ Google מושך מאיתנו (edge cache יציב) במקום מהספק.
// ============================================================
import { NextRequest } from 'next/server';
import { PRODUCTS } from '@/lib/catalog';

export const runtime = 'nodejs';
// נבנה פעם, נשמר ב-edge cache. תמונה למוצר אינה משתנה ⇒ immutable.
const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

export async function GET(req: NextRequest, { params }: { params: { sku: string } }) {
  const p = PRODUCTS.find((x) => x.sku === params.sku);
  const src = p?.imageUrl;
  if (!src) return new Response('not found', { status: 404 });

  // תמונה מקומית — כבר על הדומיין שלנו; מפנים אליה.
  if (!/^https?:\/\//i.test(src)) {
    return Response.redirect(new URL(src, req.nextUrl.origin), 308);
  }

  try {
    const r = await fetch(src, {
      headers: {
        Referer: 'https://emunavebitachon.co.il/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      cache: 'no-store',
    });
    const ct = r.headers.get('content-type') || '';
    if (!r.ok || !ct.startsWith('image')) {
      // תמונת ספק שבורה (מחזירה HTML/שגיאה) — fallback לתמונה מקומית אם קיימת.
      return Response.redirect(new URL(`/images/supplier-real/${params.sku}.jpg`, req.nextUrl.origin), 308);
    }
    const buf = await r.arrayBuffer();
    return new Response(buf, { status: 200, headers: { 'Content-Type': ct, 'Cache-Control': CACHE } });
  } catch {
    return Response.redirect(new URL(`/images/supplier-real/${params.sku}.jpg`, req.nextUrl.origin), 308);
  }
}
