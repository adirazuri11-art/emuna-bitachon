'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Pencil, Loader2, Check, X, UploadCloud } from 'lucide-react';

// מקטין תמונה ל-JPEG קטן (data-URI) לפני שמירה — שומר על ה-DB רזה.
function fileToDataUrl(file: File, maxDim = 700): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d')?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { resolve(c.toDataURL('image/jpeg', 0.82)); } catch { reject(new Error('fail')); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('לא ניתן לקרוא את התמונה')); };
    img.src = url;
  });
}

const field = 'w-full rounded-xl border border-gold/20 bg-[#0B132B] px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-gold/60';

export function ProductEditor({ sku, initialName, initialImage }: { sku: string; initialName: string; initialImage?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<string | undefined>(initialImage);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; text: string } | null>(null);

  async function onImage(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    try { setImage(await fileToDataUrl(file)); }
    catch { setMsg({ t: 'err', text: 'לא ניתן לקרוא את התמונה (נסה JPG/PNG)' }); }
  }

  async function save() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/crm/inventory', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProduct', sku, name: name.trim(), imageUrl: image ?? '' }),
      });
      const data = await res.json();
      if (!data.ok) { setMsg({ t: 'err', text: data.error || 'שגיאה' }); return; }
      setMsg({ t: 'ok', text: 'נשמר ✓' });
      setOpen(false);
      router.refresh();
    } catch { setMsg({ t: 'err', text: 'שגיאת רשת' }); } finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/10">
        <Pencil className="h-3.5 w-3.5" /> ערוך שם ותמונה
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-cream/80">עריכת מוצר</span>
        <button onClick={() => setOpen(false)} className="text-cream/40 hover:text-cream"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-col items-center gap-2">
          <span className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-white">
            {image ? <Image src={image} alt="" fill className="object-contain p-1" sizes="96px" unoptimized /> : <span className="flex h-full items-center justify-center text-2xl">🎁</span>}
          </span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gold/20 px-2.5 py-1.5 text-xs text-cream/70 hover:bg-white/5">
            <UploadCloud className="h-3.5 w-3.5" /> העלה תמונה
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-cream/50">שם המוצר</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} dir="auto" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:scale-[1.02] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} שמור
            </button>
            {msg && <span className={'text-sm ' + (msg.t === 'ok' ? 'text-emerald-300' : 'text-red-300')}>{msg.text}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
