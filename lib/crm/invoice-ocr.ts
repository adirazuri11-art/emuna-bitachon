// ============================================================
// CRM — סריקת חשבונית ספק ב-AI ראייה (Gemini free tier). server-only.
// מקבל תמונה/PDF → מחזיר שורות מובנות (קוד ספק, כמות, מחיר) לאישור.
// ⚠️ רק חילוץ טקסט — לא מעדכן מלאי. העדכון דרך approveIntake אחרי אישור ידני.
// דרוש GEMINI_API_KEY (חינמי מ-Google AI Studio).
// ============================================================

import 'server-only';

export interface ParsedLine { supplierCode: string; quantity: number; unitCost?: number; rawName?: string }
export interface ParsedInvoice {
  ok: boolean;
  error?: string;
  needsKey?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  lines: ParsedLine[];
}

const PROMPT = `אתה קורא חשבונית ספק של חנות יודאיקה (הספק: ART Judaica / israel-judaica.com).
חלץ את שורות המוצרים. החזר JSON בלבד במבנה:
{"invoiceNumber": string, "invoiceDate": "YYYY-MM-DD", "lines": [{"supplierCode": string, "quantity": number, "unitCost": number}]}
כללים:
- supplierCode = קוד המוצר/קטלוג של הספק (בד"כ בפורמט כמו "UK49849" או "UK67651"). זהו השדה הכי חשוב.
- quantity = כמות (מספר שלם).
- unitCost = מחיר ליחידה (מספר). אם מופיע רק סכום שורה, חלק בכמות.
- אם שדה לא ברור — השמט אותו. אל תמציא ערכים.
- החזר אך ורק JSON תקין, בלי טקסט נוסף.`;

export async function parseInvoiceImage(base64: string, mimeType: string): Promise<ParsedInvoice> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, needsKey: true, error: 'חסר GEMINI_API_KEY — יש להוסיף מפתח חינמי בהגדרות Vercel', lines: [] };
  if (!base64) return { ok: false, error: 'לא התקבל קובץ', lines: [] };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
          generationConfig: { temperature: 0, response_mime_type: 'application/json' },
        }),
        cache: 'no-store',
      },
    );
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return { ok: false, error: `Gemini החזיר שגיאה (${res.status}). ${t.slice(0, 120)}`, lines: [] };
    }
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) return { ok: false, error: 'לא ניתן היה לקרוא את החשבונית — נסה תמונה ברורה יותר', lines: [] };
      parsed = JSON.parse(m[0]);
    }
    const rawLines = Array.isArray(parsed.lines) ? parsed.lines : [];
    const lines: ParsedLine[] = rawLines
      .map((l) => {
        const o = l as Record<string, unknown>;
        return {
          supplierCode: String(o.supplierCode ?? '').trim().toUpperCase(),
          quantity: Math.round(Number(o.quantity ?? 0)),
          unitCost: o.unitCost != null ? Number(o.unitCost) : undefined,
          rawName: o.rawName ? String(o.rawName) : undefined,
        };
      })
      .filter((l) => l.supplierCode && l.quantity > 0);

    return {
      ok: true,
      invoiceNumber: parsed.invoiceNumber ? String(parsed.invoiceNumber) : undefined,
      invoiceDate: parsed.invoiceDate ? String(parsed.invoiceDate) : undefined,
      lines,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 140) : 'שגיאת סריקה', lines: [] };
  }
}
