// ⚠️ בדיקה זמנית — מאמתת ש-GEMINI_API_KEY קיים ותקף. מוגן ב-MIGRATE_SECRET. יימחק.
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, hasKey: false, error: 'GEMINI_API_KEY עדיין לא נטען (צריך redeploy אחרי ההוספה)' });
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }], generationConfig: { temperature: 0 } }),
      cache: 'no-store',
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return NextResponse.json({ ok: res.ok, hasKey: true, geminiStatus: res.status, geminiReply: String(text).trim().slice(0, 40), keyLen: key.length });
  } catch (e) {
    return NextResponse.json({ ok: false, hasKey: true, error: e instanceof Error ? e.message.slice(0, 120) : 'error' });
  }
}
