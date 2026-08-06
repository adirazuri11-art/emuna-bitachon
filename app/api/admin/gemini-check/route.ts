// ⚠️ בדיקה זמנית — מאמתת ש-GEMINI_API_KEY קיים ותקף. מוגן ב-MIGRATE_SECRET. יימחק.
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, hasKey: false, error: 'GEMINI_API_KEY עדיין לא נטען (צריך redeploy אחרי ההוספה)' });
  // רשימת המודלים הזמינים למפתח הזה — כדי לבחור שם מודל תקף
  if (new URL(req.url).searchParams.get('models') === '1') {
    const m = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`).then((r) => r.json()).catch((e) => ({ error: String(e) }));
    const names = Array.isArray(m?.models) ? m.models.filter((x: { supportedGenerationMethods?: string[] }) => x.supportedGenerationMethods?.includes('generateContent')).map((x: { name: string }) => x.name) : m;
    return NextResponse.json({ models: names });
  }
  try {
    const candidates = ['gemini-2.0-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-2.0-flash'];
    const results: Array<{ model: string; status: number }> = [];
    let working = '';
    for (const model of candidates) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply OK' }] }], generationConfig: { temperature: 0 } }),
        cache: 'no-store',
      });
      results.push({ model, status: res.status });
      if (res.ok) { working = model; break; }
    }
    return NextResponse.json({ ok: !!working, hasKey: true, workingModel: working || null, results, keyLen: key.length });
  } catch (e) {
    return NextResponse.json({ ok: false, hasKey: true, error: e instanceof Error ? e.message.slice(0, 120) : 'error' });
  }
}
