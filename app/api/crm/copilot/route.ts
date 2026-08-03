// ============================================================
// CRM AI Copilot — Hebrew business assistant.
// Grounded: it receives ONLY an aggregated, non-PII snapshot of real CRM
// data and must answer strictly from it (or say it doesn't have the number).
// No customer emails / raw rows are ever sent to the model.
// Gated by the CRM session cookie.
// ============================================================

import { anthropic } from '@ai-sdk/anthropic';
import { convertToCoreMessages, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { getCrmContext } from '@/lib/crm/data';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  }

  const { messages } = await req.json();
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

  const result = await streamText({
    model: anthropic('claude-sonnet-5'),
    system,
    messages: convertToCoreMessages(messages ?? []),
    maxTokens: 700,
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}
