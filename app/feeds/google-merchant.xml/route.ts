// ============================================================
// GET /feeds/google-merchant.xml — פיד המוצרים הרשמי ל-Google Merchant Center.
// מקור יחיד ורשמי לכתובת הפיד. נבנה מ-PRODUCTS (מקור האמת), UTF-8, ללא Login.
// ============================================================
import { buildFeedXml } from '@/lib/google-merchant/feed';

// נבנה בזמן build ומתרענן כל שעה (revalidate). מוצר/מחיר חדש → deploy → פיד עדכני.
export const revalidate = 3600;

export async function GET() {
  try {
    const xml = buildFeedXml();
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    // אף פעם לא חושפים Stack Trace — מחזירים XML ריק תקין עם קוד שגיאה.
    const empty =
      '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n  <title>אמונה וביטחון</title>\n</channel>\n</rss>\n';
    return new Response(empty, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
