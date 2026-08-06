// ⚠️ זמני — MIGRATE_SECRET. בודק את מפתח ה-GEMINI האמיתי בזמן ריצה בפרוד (אורך+תקינות, בלי לחשוף). יימחק.
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== process.env.MIGRATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const k = process.env.GEMINI_API_KEY || '';
  let geminiStatus = 0;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}`, { cache: 'no-store' });
    geminiStatus = r.status;
  } catch { geminiStatus = -1; }
  return NextResponse.json({
    ok: true,
    keyLength: k.length,
    keyPrefix2: k.slice(0, 2),
    geminiStatus, // 200 = המפתח תקין
    valid: geminiStatus === 200,
  });
}
