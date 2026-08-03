// ============================================================
// CRM AI Copilot — Hebrew business assistant.
// Calls the Anthropic Messages API directly (no SDK version coupling).
// Grounded: receives ONLY an aggregated, non-PII snapshot of real CRM data
// and must answer strictly from it. Gated by the CRM session cookie.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { getCrmContext } from '@/lib/crm/data';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MODEL = 'claude-sonnet-5';

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const { messages } = await req.json().catch(() => ({ messages: [] }));
  const context = await getCrmContext();

  const system = `אתה ה-Copilot העסקי של מרכז השליטה (CRM) של חנות היודאיקה "אמונה וביטחון".

כללי ברזל:
- ענה בעברית עסקית, קצרה וברורה. אתה מדבר עם בעל העסק.
- השתמש אך ורק בנתונים שבתוך ה-JSON למטה. אל תמציא מספרים.
- אם נתון מסוים לא קיים ב-JSON, אמור בכנות: "אין לי כרגע את הנתון הזה" והסבר איזה מקור נדרש (למשל: מודול ההזמנות עדיין לא פעיל).
- כשרלוונטי, הוסף שורת "המלצה:" עם פעולה עסקית אחת קונקרטית.
- הבחן בין עובדה (מהנתונים) לבין המלצה (פרשנות שלך).
- אל תחשוף מידע אישי; אין לך גישה למיילים או רשומות פרטניות.

נתוני ה-CRM (מצב אמיתי, נכון ל-${context.asOf}):
${JSON.stringify(context, null, 2)}`;

  const apiMessages = (Array.isArray(messages) ? messages : [])
    .filter((m: { role?: string }) => m?.role === 'user' || m?.role === 'assistant')
    .map((m: { role: string; content: unknown }) => ({
      role: m.role,
      content: String(m.content ?? '').slice(0, 4000),
    }))
    .slice(-12);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system, messages: apiMessages }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return NextResponse.json({ error: 'ai_error', detail }, { status: 200 });
    }
    const data = await res.json();
    const text =
      Array.isArray(data?.content)
        ? data.content.map((c: { text?: string }) => c.text ?? '').join('').trim()
        : '';
    return NextResponse.json({ text: text || 'לא התקבלה תשובה.' });
  } catch (e) {
    return NextResponse.json({ error: 'ai_exception', detail: String(e).slice(0, 200) }, { status: 200 });
  }
}
