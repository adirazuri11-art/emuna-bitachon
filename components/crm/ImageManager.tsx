'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, RotateCw, Check, Loader2, Star } from 'lucide-react';

interface Version { id: string; imageUrl: string; isMain: boolean; source: string; createdAt: string }

const ASPECTS: { key: string; label: string; ratio: number | null }[] = [
  { key: 'orig', label: 'מקורי', ratio: null },
  { key: '1', label: '1:1', ratio: 1 },
  { key: '45', label: '4:5', ratio: 4 / 5 },
  { key: '916', label: '9:16', ratio: 9 / 16 },
  { key: '169', label: '16:9', ratio: 16 / 9 },
];

// עיבוד: סיבוב → חיתוך-מרכז ליחס → הקטנה ל-max 900px → JPEG data-URI.
async function process(file: File, rotate: number, ratio: number | null): Promise<string> {
  const bmp = await createImageBitmap(file);
  const rot = ((rotate % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const sw = swap ? bmp.height : bmp.width;
  const sh = swap ? bmp.width : bmp.height;
  // ממדי חיתוך לפי יחס
  let cw = sw, ch = sh;
  if (ratio) { if (sw / sh > ratio) cw = Math.round(sh * ratio); else ch = Math.round(sw / ratio); }
  const scale = Math.min(1, 900 / Math.max(cw, ch));
  const ow = Math.round(cw * scale), oh = Math.round(ch * scale);
  const canvas = document.createElement('canvas');
  canvas.width = ow; canvas.height = oh;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, ow, oh);
  ctx.translate(ow / 2, oh / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(scale, scale);
  // ציור ממורכז (חיתוך מרכז)
  ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function ImageManager({ sku, initialMain, initialVersions }: { sku: string; initialMain?: string; initialVersions: Version[] }) {
  const [versions, setVersions] = useState<Version[]>(initialVersions);
  const [mainImg, setMainImg] = useState<string | undefined>(initialMain);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState('orig');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const regen = useCallback(async (f: File, rot: number, asp: string) => {
    try {
      const ratio = ASPECTS.find((a) => a.key === asp)?.ratio ?? null;
      setPreview(await process(f, rot, ratio));
    } catch { setMsg('קובץ תמונה לא תקין'); }
  }, []);

  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)) { setMsg('רק קובצי תמונה'); return; }
    setFile(f); setRotate(0); setAspect('orig'); setMsg(null);
    await regen(f, 0, 'orig');
  };

  const doRotate = async () => { const r = (rotate + 90) % 360; setRotate(r); if (file) await regen(file, r, aspect); };
  const doAspect = async (a: string) => { setAspect(a); if (file) await regen(file, rotate, a); };

  const save = async () => {
    if (!preview) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/crm/inventory-v2/${encodeURIComponent(sku)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'saveImage', imageUrl: preview, setMain: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setMainImg(preview);
        setVersions((v) => [{ id: data.versionId ?? Math.random().toString(), imageUrl: preview, isMain: true, source: 'crm_upload', createdAt: new Date().toISOString() }, ...v.map((x) => ({ ...x, isMain: false }))]);
        setFile(null); setPreview(null); setMsg('התמונה נשמרה ✓');
      } else setMsg(data.error || 'שמירה נכשלה');
    } catch { setMsg('שגיאת רשת'); } finally { setBusy(false); }
  };

  const makeMain = async (v: Version) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/crm/inventory-v2/${encodeURIComponent(sku)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'setMainImage', versionId: v.id }),
      });
      const data = await res.json();
      if (data.ok) { setMainImg(v.imageUrl); setVersions((list) => list.map((x) => ({ ...x, isMain: x.id === v.id }))); setMsg('הוגדרה כתמונה ראשית ✓'); }
      else setMsg(data.error || 'נכשל');
    } catch { setMsg('שגיאת רשת'); } finally { setBusy(false); }
  };

  const dataUrl = (s?: string) => !!s && s.startsWith('data:');

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* תמונה ראשית נוכחית */}
        <div>
          <div className="mb-2 text-xs text-cream/50">תמונה ראשית נוכחית</div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gold/15 bg-white">
            {mainImg ? <Image src={mainImg} alt="" fill className="object-contain p-2" sizes="400px" unoptimized={dataUrl(mainImg)} /> : <span className="flex h-full items-center justify-center text-5xl">🎁</span>}
          </div>
        </div>

        {/* אזור עריכה */}
        <div>
          <div className="mb-2 text-xs text-cream/50">{preview ? 'תצוגה מקדימה' : 'העלאת/החלפת תמונה'}</div>
          {!preview ? (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/25 bg-white/5 text-center text-cream/60 hover:border-gold/50"
            >
              <Upload className="h-7 w-7 text-gold/70" />
              <div className="text-sm">גרור תמונה לכאן או לחץ לבחירה</div>
              <div className="text-[11px] text-cream/40">JPG · PNG · WEBP · HEIC</div>
              <input ref={inputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gold/25 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="h-full w-full object-contain p-2" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={doRotate} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-cream/80 hover:bg-white/5"><RotateCw className="h-3.5 w-3.5" /> סובב</button>
                {ASPECTS.map((a) => (
                  <button key={a.key} onClick={() => doAspect(a.key)} className={'rounded-lg px-2.5 py-1.5 text-xs ' + (aspect === a.key ? 'bg-gold/15 font-bold text-gold' : 'border border-white/10 text-cream/70 hover:bg-white/5')}>{a.label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} שמור כתמונה ראשית
                </button>
                <button onClick={() => { setFile(null); setPreview(null); }} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-cream/70 hover:bg-white/5">ביטול</button>
              </div>
            </div>
          )}
          {msg && <div className="mt-2 text-xs text-gold">{msg}</div>}
        </div>
      </div>

      {/* גלריית גרסאות */}
      <div>
        <div className="mb-2 text-xs text-cream/50">היסטוריית תמונות ({versions.length})</div>
        {versions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-cream/40">עדיין לא נשמרו תמונות ב-CRM. התמונה הראשית מגיעה מהקטלוג עד להחלפה.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {versions.map((v) => (
              <div key={v.id} className="w-28">
                <div className={'relative aspect-square overflow-hidden rounded-xl border bg-white ' + (v.isMain ? 'border-gold' : 'border-white/10')}>
                  <Image src={v.imageUrl} alt="" fill className="object-contain p-1" sizes="112px" unoptimized={dataUrl(v.imageUrl)} />
                  {v.isMain && <span className="absolute end-1 top-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-navy">ראשי</span>}
                </div>
                {!v.isMain && <button onClick={() => makeMain(v)} disabled={busy} className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 py-1 text-[11px] text-cream/70 hover:bg-white/5"><Star className="h-3 w-3" /> הפוך לראשי</button>}
                <div className="mt-0.5 text-center text-[10px] text-cream/30">{new Date(v.createdAt).toLocaleDateString('he-IL')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-cream/35">כל תמונה נשמרת ב-CRM בלבד. תמונת האתר המקורית נשמרת כ״מקור קטלוג״ ואינה משתנה.</p>
    </div>
  );
}
