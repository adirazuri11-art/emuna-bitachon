// ============================================================
// Inventory v2 — מנוע מסמכים חכם. server-only.
// אסטרטגיה ל"מושלם":
//  1) PDF דיגיטלי → חילוץ שכבת טקסט (unpdf) → פענוח על טקסט נקי (דיוק ~100%).
//  2) צילום/סרוק → AI ראייה, מספר מעברים, בחירת המעבר התקין (סכום תואם).
//  3) יישור מול הקטלוג: קוד שגוי מתוקן אוטומטית לקוד קטלוג קרוב; המחיר מאומת
//     מול עלות הקטלוג (=מחיר ART) → כל שורה מקבלת סטטוס: ודאי / לבדיקה / מחיר-שונה.
// ⚠️ רק חילוץ — לא מעדכן מלאי. עדכון דרך אישור ידני.
// ============================================================

import 'server-only';
import { PRODUCTS } from '@/lib/catalog';
import supplierData from '@/lib/supplier-products.json';

// ---- קטלוג: קוד → {עלות, שם} (מקור אמת לזיהוי + אימות מחיר) ----
const CAT_COST = new Map<string, number>();
const CAT_NAME = new Map<string, string>();
for (const it of (supplierData as { items: Array<{ id: string; cost: number }> }).items) {
  CAT_COST.set(it.id.toUpperCase(), Number(it.cost) || 0);
}
for (const p of PRODUCTS) CAT_NAME.set(p.sku.toUpperCase(), p.titleHe);
const CODES = Array.from(new Set(Array.from(CAT_COST.keys()).concat(Array.from(CAT_NAME.keys()))));

export type LineStatus = 'confirmed' | 'price_changed' | 'review' | 'not_found' | 'inconsistent';
export interface ParsedLineV2 {
  supplierCode: string; rawCode: string; catalogName?: string;
  quantity: number; unitCost?: number; lineTotal?: number; catalogCost?: number;
  confidence: number; status: LineStatus; note?: string; suggestedUnitCost?: number;
}
export interface ParsedInvoiceV2 {
  ok: boolean; error?: string; needsKey?: boolean;
  method: 'pdf-text' | 'vision' | 'none'; passes?: number;
  invoiceNumber?: string; invoiceDate?: string; total?: number;
  lines: ParsedLineV2[]; rawText?: string; warnings: string[];
  stats: { linesFound: number; confirmed: number; needsReview: number; sumLines: number };
}

const UK_RE = /\bUK\s?-?\s?\d{3,6}\b/gi;
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
const normCode = (c: string) => String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

// תיקון קוד לקוד קטלוג קרוב (מתקן שגיאות OCR של ספרה אחת/שתיים). מחזיר null אם עמום.
function correctCode(raw: string): string | null {
  const c = normCode(raw);
  if (CAT_COST.has(c) || CAT_NAME.has(c)) return c;
  let best: string | null = null, bestD = 99, ties = 0;
  for (const code of CODES) {
    const d = editDistance(c, code);
    if (d < bestD) { bestD = d; best = code; ties = 1; }
    else if (d === bestD) ties++;
  }
  return bestD <= 2 && ties === 1 ? best : null;
}

// ---- קריאת Gemini (ראייה או טקסט) → invoiceNumber/date/total/lines ----
const RULES = `כללי ברזל:
- supplierCode = "מפתח פריט", בפורמט UK + מספר (UK10478). העתק בדיוק, בלי רווחים.
- quantity = "כמות" (מספר). unitCost = "מחיר" ליחידה בדיוק כפי שמופיע (כבר לפני מע"מ) — אל תחלק, אל תשנה. lineTotal = "סה"כ" של השורה (=כמות×מחיר).
- total = סך הכל לפני מע"מ של החשבונית ("סה"כ לפני מע"מ"). invoiceNumber = מספר החשבונית.
- החזר שורה אחת לכל קוד UK, בלי לדלג ובלי לכפול. אמת בכל שורה: כמות×מחיר=סה"כ.
- בלי שם מוצר. החזר JSON תקין בלבד:
{"invoiceNumber":string,"invoiceDate":"YYYY-MM-DD","total":number,"lines":[{"supplierCode":string,"quantity":number,"unitCost":number,"lineTotal":number}]}`;

async function callGemini(parts: object[]): Promise<{ invoiceNumber?: string; invoiceDate?: string; total?: number; lines: Array<Record<string, unknown>> } | { error: string; needsKey?: boolean }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: 'חסר GEMINI_API_KEY', needsKey: true };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0, response_mime_type: 'application/json' } }),
      cache: 'no-store',
    });
    if (!res.ok) return { error: `AI ${res.status}` };
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const p = JSON.parse(raw);
    return { invoiceNumber: p.invoiceNumber ? String(p.invoiceNumber) : undefined, invoiceDate: p.invoiceDate ? String(p.invoiceDate) : undefined, total: num(p.total), lines: Array.isArray(p.lines) ? p.lines : [] };
  } catch (e) { return { error: e instanceof Error ? e.message.slice(0, 120) : 'parse error' }; }
}

const visionPrompt = `זו חשבונית מס מהספק ART Judaica (ארט יודאיקה / Food Appeal). קרא בדיוק מוחלט.
הטבלה ימין-לשמאל: מימין "כמות", ואז "מפתח פריט" (קוד UK), "שם פריט", ומשמאל "מחיר" ואז "סה"כ".
עבוד שורה אחר שורה מלמעלה למטה; לכל קוד UK קרא באותו קו אופקי בדיוק את הכמות (ימין) והמחיר/סה"כ (שמאל). ${RULES}`;
const textPrompt = (t: string) => `להלן טקסט שחולץ מחשבונית ספק של ART Judaica. פענח את שורות המוצרים בדיוק. ${RULES}\n\nהטקסט:\n"""${t.slice(0, 24000)}"""`;

async function extractPdfText(base64: string): Promise<string> {
  try {
    const { extractText } = await import('unpdf');
    const { text } = await extractText(new Uint8Array(Buffer.from(base64, 'base64')), { mergePages: true });
    return Array.isArray(text) ? text.join('\n') : String(text ?? '');
  } catch { return ''; }
}

// ---- יישור מול הקטלוג + סטטוס לכל שורה ----
function reconcile(rawLines: Array<Record<string, unknown>>): ParsedLineV2[] {
  return rawLines.map((l) => {
    const rawCode = normCode(String(l.supplierCode ?? ''));
    const corrected = correctCode(rawCode);
    const code = corrected ?? rawCode;
    const quantity = Math.max(0, Math.round(num(l.quantity) ?? 0));
    const unitCost = num(l.unitCost);
    const lineTotal = num(l.lineTotal);
    const catalogCost = CAT_COST.get(code);
    const catalogName = CAT_NAME.get(code);
    const inCatalog = CAT_COST.has(code) || CAT_NAME.has(code);
    const consistent = unitCost != null && lineTotal != null ? Math.abs(quantity * unitCost - lineTotal) <= 0.5 : true;
    const priceMatches = catalogCost != null && unitCost != null && catalogCost > 0 ? Math.abs(unitCost - catalogCost) / catalogCost <= 0.02 : false;

    let status: LineStatus; let confidence: number; let note: string | undefined; let suggestedUnitCost: number | undefined;
    if (!consistent) { status = 'inconsistent'; confidence = 0.35; note = 'כמות×מחיר אינו שווה לסה"כ — קריאה לא ודאית.'; }
    else if (!inCatalog) { status = 'not_found'; confidence = 0.5; note = corrected === null && rawCode ? `הקוד "${rawCode}" לא זוהה בקטלוג — בחר מוצר או צור חדש.` : 'קוד שאינו בקטלוג — לאימות.'; }
    else if (priceMatches) { status = 'confirmed'; confidence = 0.98; }
    else if (catalogCost != null && unitCost != null) { status = 'price_changed'; confidence = 0.6; suggestedUnitCost = catalogCost; note = `מחיר בחשבונית ${unitCost}₪ שונה מעלות הקטלוג ${catalogCost}₪ — שינוי מחיר אמיתי או טעות קריאה? אשר.`; }
    else { status = 'review'; confidence = 0.65; note = 'לבדיקה.'; }
    if (corrected && corrected !== rawCode && status === 'confirmed') { confidence = 0.9; note = `הקוד תוקן מ-"${rawCode}" ל-"${corrected}".`; }

    return { supplierCode: code, rawCode, catalogName, quantity, unitCost, lineTotal, catalogCost, confidence, status, note, suggestedUnitCost };
  });
}

function scoreResult(lines: ParsedLineV2[], total: number | undefined): number {
  const sum = lines.reduce((s, l) => s + (l.lineTotal ?? (l.unitCost ?? 0) * l.quantity), 0);
  let score = 0;
  if (total && Math.abs(sum - total) <= 1) score += 1000;              // סכום תואם = אות חזק לתקינות
  score += lines.filter((l) => l.status === 'confirmed').length * 10;   // שורות ודאיות
  const codes = new Set(lines.map((l) => l.supplierCode));
  score -= (lines.length - codes.size) * 20;                            // עונש על כפילויות
  return score;
}

export async function parseInvoiceSmart(base64: string, mimeType: string, fileName = ''): Promise<ParsedInvoiceV2> {
  const empty: ParsedInvoiceV2 = { ok: false, method: 'none', lines: [], warnings: [], stats: { linesFound: 0, confirmed: 0, needsReview: 0, sumLines: 0 } };
  if (!base64) return { ...empty, error: 'לא התקבל קובץ' };
  const isPdf = /pdf/i.test(mimeType) || /\.pdf$/i.test(fileName);

  let method: ParsedInvoiceV2['method'] = 'none';
  let rawText = '';
  let best: { invoiceNumber?: string; invoiceDate?: string; total?: number; lines: Array<Record<string, unknown>> } | null = null;
  let passes = 0;

  if (isPdf) rawText = await extractPdfText(base64);

  if (isPdf && rawText.trim().length > 40) {
    method = 'pdf-text';
    const g = await callGemini([{ text: textPrompt(rawText) }]);
    if ('error' in g) return { ...empty, method, error: g.error, needsKey: g.needsKey, rawText };
    best = g; passes = 1;
  } else {
    method = 'vision';
    // מספר מעברים — בוחרים את התקין ביותר (סכום תואם / הכי הרבה שורות ודאיות).
    let bestScore = -1e9;
    for (let i = 0; i < 3; i++) {
      const g = await callGemini([{ text: visionPrompt }, { inline_data: { mime_type: mimeType, data: base64 } }]);
      if ('error' in g) { if (i === 0) return { ...empty, method, error: g.error, needsKey: g.needsKey }; continue; }
      passes++;
      const sc = scoreResult(reconcile(g.lines), g.total);
      if (sc > bestScore) { bestScore = sc; best = g; }
      if (bestScore >= 1000) break; // מעבר מושלם (סכום תואם) — די.
    }
  }

  if (!best) return { ...empty, method, error: 'פענוח נכשל', rawText };

  const lines = reconcile(best.lines);
  const sumLines = Math.round(lines.reduce((s, l) => s + (l.lineTotal ?? (l.unitCost ?? 0) * l.quantity), 0) * 100) / 100;
  const warnings: string[] = [];
  const codesInText = new Set((rawText.match(UK_RE) ?? []).map(normCode));
  if (best.total && Math.abs(sumLines - best.total) > 1) warnings.push(`סכום השורות (${sumLines}) אינו תואם לסך החשבונית (${best.total}) — ייתכן שחסרה/שגויה שורה.`);
  if (method === 'pdf-text' && codesInText.size > lines.length) warnings.push(`זוהו ${codesInText.size} קודים בטקסט אך ${lines.length} שורות פוענחו.`);
  const dupes = lines.length - new Set(lines.map((l) => l.supplierCode)).size;
  if (dupes > 0) warnings.push(`${dupes} קודים כפולים — דורש בדיקה.`);

  return {
    ok: true, method, passes,
    invoiceNumber: best.invoiceNumber, invoiceDate: best.invoiceDate, total: best.total,
    lines, rawText: rawText || undefined, warnings,
    stats: {
      linesFound: lines.length,
      confirmed: lines.filter((l) => l.status === 'confirmed').length,
      needsReview: lines.filter((l) => l.status !== 'confirmed').length,
      sumLines,
    },
  };
}
