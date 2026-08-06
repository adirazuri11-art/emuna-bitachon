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

const PROMPT = `אתה קורא חשבונית ספק של חנות יודאיקה מהספק ART Judaica (ארט יודאיקה / Food Appeal / israel-judaica.com).
מבנה טבלת המוצרים (עמודות מימין לשמאל): כמות | מפתח פריט | שם פריט | מחיר | סה"כ.
חלץ את כל שורות המוצרים במדויק. החזר JSON בלבד:
{"invoiceNumber": string, "invoiceDate": "YYYY-MM-DD", "lines": [{"supplierCode": string, "name": string, "quantity": number, "unitCost": number, "lineTotal": number}]}
כללים מחייבים:
- supplierCode = עמודת "מפתח פריט", כמעט תמיד בפורמט UK + מספר (למשל UK10478, UK81668). העתק בדיוק, בלי רווחים.
- quantity = עמודת "כמות" (מספר שלם, למשל 12 או 2).
- unitCost = עמודת "מחיר" — מחיר ליחידה **בדיוק כפי שמופיע (כבר לפני מע"מ)**. אסור לחלק במע"מ, אסור לשנות. המע"מ (18%) מתווסף פעם אחת בתחתית החשבונית בלבד, לא לכל שורה.
- lineTotal = עמודת "סה"כ" של השורה (= כמות × מחיר, למשל 239.88).
- invoiceNumber = מספר החשבונית ("חשבונית מס מס' ...", למשל 451729).
- קרא כל ספרה בדיוק כולל אגורות (19.99, 54.99). אל תעגל, אל תמציא, אל תדלג על אף שורה.
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
          rawName: o.name ? String(o.name) : (o.rawName ? String(o.rawName) : undefined),
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
