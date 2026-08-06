'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, X, Check, Loader2, Upload } from 'lucide-react';

interface Props {
  sku: string;
  name: string;
  description?: string | null;
  retailPrice?: number | null;
  image?: string;
  compact?: boolean; // כפתור אייקון בלבד (לטבלה)
  onSaved?: () => void;
}

// הקטנת תמונה ל-JPEG data-URI (max 900px) — נשמר ב-CRM בלבד.
function fileToJpeg(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = rej; img.src = String(r.result);
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

export function QuickEditProduct({ sku, name, description, retailPrice, image, compact, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [nm, setNm] = useState(name);
  const [desc, setDesc] = useState(description ?? '');
  const [price, setPrice] = useState(retailPrice != null ? String(retailPrice) : '');
  const [newImg, setNewImg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (f?: File | null) => {
    if (!f) return;
    try { setNewImg(await fileToJpeg(f)); } catch { setErr('קובץ תמונה לא תקין'); }
  };

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const url = `/api/crm/inventory-v2/${encodeURIComponent(sku)}`;
      const post = (body: object) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
      const fields: Record<string, unknown> = { name: nm, internalDescription: desc };
      if (price !== '') fields.retailPriceOverride = Number(price);
      const r1 = await post({ action: 'updateFields', fields });
      if (!r1.ok) { setErr(r1.error || 'שמירה נכשלה'); setBusy(false); return; }
      if (newImg) { const r2 = await post({ action: 'saveImage', imageUrl: newImg, setMain: true }); if (!r2.ok) { setErr(r2.error || 'שמירת תמונה נכשלה'); setBusy(false); return; } }
      setOpen(false); setBusy(false);
      if (onSaved) onSaved(); else location.reload();
    } catch { setErr('שגיאת רשת'); setBusy(false); }
  };

  const input = 'w-full rounded-lg border border-gold/20 bg-[#0B132B] px-3 py-2 text-sm text-cream outline-none focus:border-gold/60';
  const preview = newImg || image;

  return (
    <>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={compact ? 'inline-flex items-center rounded-lg p-1.5 text-cream/50 hover:bg-white/10 hover:text-gold' : 'inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/80 hover:bg-white/5'}
        title="עריכה מהירה">
        <Pencil className="h-3.5 w-3.5" />{!compact && ' עריכה מהירה'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gold/20 bg-[#0B132B] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-cream">עריכה מהירה</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-cream/50 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gold/20 bg-white">
                  {preview ? <Image src={preview} alt="" fill className="object-contain p-0.5" sizes="64px" unoptimized={preview.startsWith('data:')} /> : <span className="flex h-full items-center justify-center text-2xl">🎁</span>}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100"><Upload className="h-5 w-5 text-white" /></span>
                  <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
                <div className="text-xs text-cream/50">לחץ על התמונה להחלפה<br />(נשמר ב-CRM בלבד)</div>
              </div>
              <label className="block text-xs text-cream/50">שם המוצר<input className={input + ' mt-1'} value={nm} onChange={(e) => setNm(e.target.value)} /></label>
              <label className="block text-xs text-cream/50">תיאור<textarea className={input + ' mt-1'} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="תיאור פנימי…" /></label>
              <label className="block text-xs text-cream/50">מחיר לצרכן (₪)<input className={input + ' mt-1'} type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" /></label>
              {err && <div className="text-xs text-red-300">{err}</div>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-cream/70 hover:bg-white/5">ביטול</button>
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
