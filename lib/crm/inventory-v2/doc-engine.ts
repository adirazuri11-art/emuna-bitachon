// ============================================================
// Inventory v2 — מנוע מסמכים חכם. server-only.
// אסטרטגיה ל"מושלם": PDF דיגיטלי → חילוץ שכבת הטקסט (unpdf) → פענוח על טקסט נקי
// (לא תמונה) → דיוק כמעט מלא. OCR/ראייה רק כשאין שכבת טקסט (סרוק/צילום).
// אימות צולב: זיהוי קודי UK ב-regex + בדיקת סכומים + Confidence לכל שורה.
// ⚠️ רק חילוץ — לא מעדכן מלאי. עדכון דרך אישור ידני.
// ============================================================

import 'server-only';
import { parseInvoiceImage } from '@/lib/crm/invoice-ocr';

export interface ParsedLineV2 {
  supplierCode: string; name?: string; quantity: number;
  unitCost?: number; lineTotal?: number; confidence: number; rawText?: string;
}
export interface ParsedInvoiceV2 {
  ok: boolean; error?: string; needsKey?: boolean;
  method: 'pdf-text' | 'vision' | 'none';
  invoiceNumber?: string; invoiceDate?: string; supplierName?: string;
  subtotal?: number; vat?: number; total?: number;
  lines: ParsedLineV2[];
  rawText?: string;
  warnings: string[];
  stats: { linesFound: number; codesInText: number; highConfidence: number; needsReview: number };
}

const UK_RE = /\bUK\s?-?\s?(\d{4,6})\b/gi;
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };

async function extractPdfText(base64: string): Promise<string> {
  try {
    const { extractText } = await import('unpdf');
    const buf = Buffer.from(base64, 'base64');
    const { text } = await extractText(new Uint8Array(buf), { mergePages: true });
    return Array.isArray(text) ? text.join('\n') : String(text ?? '');
  } catch {
    return '';
  }
}

const TEXT_PROMPT = (text: string) => `להלן טקסט גולמי שחולץ מחשבונית ספק של חנות יודאיקה (הספק: ART Judaica / israel-judaica.com). קרא אותו ופענח את שורות המוצרים בדיוק מלא.
החזר JSON בלבד:
{"invoiceNumber":string,"invoiceDate":"YYYY-MM-DD","supplierName":string,"subtotal":number,"vat":number,"total":number,"lines":[{"supplierCode":string,"name":string,"quantity":number,"unitCost":number,"lineTotal":number}]}
כללים מחייבים:
- supplierCode = קוד הספק, כמעט תמיד בפורמט "UK" + מספר (למשל UK49849). זה השדה הקריטי — העתק בדיוק.
- quantity = כמות (מספר).
- unitCost = מחיר ליחידה **לפני מע"מ**. אם יש רק סכום שורה — חלק בכמות. אם המחיר כולל מע"מ — חלק ב-1.17.
- lineTotal = סך השורה כפי שמופיע.
- קרא מספרים בדיוק כולל אגורות (49.99). אל תמציא, אל תעגל. אם ערך לא קיים — השמט אותו.
- אל תדלג על אף שורת מוצר. החזר JSON תקין בלבד.

הטקסט:
"""${text.slice(0, 24000)}"""`;

async function geminiParseText(text: string): Promise<Partial<ParsedInvoiceV2> & { lines: ParsedLineV2[] } | { error: string; needsKey?: boolean }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: 'חסר GEMINI_API_KEY', needsKey: true };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`,
      {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: TEXT_PROMPT(text) }] }],
          generationConfig: { temperature: 0, response_mime_type: 'application/json' },
        }),
        cache: 'no-store',
      },
    );
    if (!res.ok) return { error: `AI ${res.status}` };
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(raw);
    const lines: ParsedLineV2[] = (parsed.lines ?? []).map((l: Record<string, unknown>) => ({
      supplierCode: String(l.supplierCode ?? '').trim().toUpperCase().replace(/\s|-/g, ''),
      name: l.name ? String(l.name) : undefined,
      quantity: Math.max(0, Math.round(num(l.quantity) ?? 0)),
      unitCost: num(l.unitCost), lineTotal: num(l.lineTotal), confidence: 0,
    }));
    return {
      invoiceNumber: parsed.invoiceNumber ? String(parsed.invoiceNumber) : undefined,
      invoiceDate: parsed.invoiceDate ? String(parsed.invoiceDate) : undefined,
      supplierName: parsed.supplierName ? String(parsed.supplierName) : undefined,
      subtotal: num(parsed.subtotal), vat: num(parsed.vat), total: num(parsed.total),
      lines,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 120) : 'parse error' };
  }
}

// ציון ביטחון לכל שורה + אימות צולב מול הטקסט הגולמי.
function scoreLines(lines: ParsedLineV2[], rawText: string): ParsedLineV2[] {
  const codesInText = new Set((rawText.match(UK_RE) ?? []).map((c) => c.toUpperCase().replace(/\s|-/g, '')));
  return lines.map((l) => {
    let c = 0.4;
    if (/^UK\d{4,6}$/.test(l.supplierCode)) c += 0.25;
    if (codesInText.has(l.supplierCode)) c += 0.2; // הקוד באמת מופיע במסמך
    if (l.quantity > 0) c += 0.1;
    if (l.unitCost && l.unitCost > 0) c += 0.05;
    return { ...l, confidence: Math.min(1, Math.round(c * 100) / 100) };
  });
}

export async function parseInvoiceSmart(base64: string, mimeType: string, fileName = ''): Promise<ParsedInvoiceV2> {
  const empty: ParsedInvoiceV2 = { ok: false, method: 'none', lines: [], warnings: [], stats: { linesFound: 0, codesInText: 0, highConfidence: 0, needsReview: 0 } };
  if (!base64) return { ...empty, error: 'לא התקבל קובץ' };
  const isPdf = /pdf/i.test(mimeType) || /\.pdf$/i.test(fileName);

  let rawText = '';
  let result: ParsedInvoiceV2 = { ...empty };

  if (isPdf) rawText = await extractPdfText(base64);
  const hasText = rawText.trim().length > 40;

  if (isPdf && hasText) {
    const g = await geminiParseText(rawText);
    if ('error' in g) return { ...empty, method: 'pdf-text', error: g.error, needsKey: g.needsKey, rawText };
    const lines = scoreLines(g.lines, rawText);
    result = { ...empty, ok: true, method: 'pdf-text', ...g, lines, rawText };
  } else {
    // סרוק/צילום — נפילה חכמה ל-AI ראייה (המנוע הקיים).
    const v = await parseInvoiceImage(base64, mimeType);
    if (!v.ok) return { ...empty, method: 'vision', error: v.error, needsKey: v.needsKey, rawText };
    const lines = scoreLines(v.lines.map((l) => ({
      supplierCode: l.supplierCode.toUpperCase().replace(/\s|-/g, ''), name: l.rawName,
      quantity: l.quantity, unitCost: l.unitCost, confidence: 0,
    })), rawText);
    result = { ...empty, ok: true, method: 'vision', invoiceNumber: v.invoiceNumber, invoiceDate: v.invoiceDate, lines, rawText };
  }

  // אימות + אזהרות
  const codesInText = new Set((rawText.match(UK_RE) ?? []).map((c) => c.toUpperCase().replace(/\s|-/g, '')));
  const warnings: string[] = [];
  if (result.method === 'pdf-text' && codesInText.size > 0 && result.lines.length < codesInText.size) {
    warnings.push(`זוהו ${codesInText.size} קודי UK בטקסט אך רק ${result.lines.length} שורות פוענחו — ייתכן שחסרות שורות.`);
  }
  const lineSum = result.lines.reduce((s, l) => s + (l.lineTotal ?? (l.unitCost ?? 0) * l.quantity), 0);
  if (result.total && lineSum > 0 && Math.abs(lineSum - result.total) / result.total > 0.02) {
    warnings.push(`סכום השורות (${Math.round(lineSum)}) אינו תואם לסכום המסמך (${Math.round(result.total)}). דורש בדיקה.`);
  }
  result.warnings = warnings;
  result.stats = {
    linesFound: result.lines.length,
    codesInText: codesInText.size,
    highConfidence: result.lines.filter((l) => l.confidence >= 0.8).length,
    needsReview: result.lines.filter((l) => l.confidence < 0.8).length,
  };
  return result;
}
