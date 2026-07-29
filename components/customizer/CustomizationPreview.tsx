'use client';

// ============================================================
// תצוגה מקדימה חיה — על גבי תמונת המוצר האמיתית.
// המיקום נקבע אוטומטית למקום המקצועי (בכיפה: קשת לאורך השוליים הקדמיים),
// הלקוח לא בוחר מיקום. צל רך → קריא על כל צבע. הלקוח רואה בדיוק מה שיקבל.
// ============================================================

import { useRef, useState } from 'react';
import { Download, Maximize2, RotateCcw, Share2 } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import type { CustomizerState } from './customizer-types';
import { useToastStore } from '@/store/toast';

const ZOOM_VIEWS = [
  { id: 'front', label: 'מבט מלא', scale: 1 },
  { id: 'close', label: 'תקריב', scale: 1.6 },
  { id: 'detail', label: 'סופר-תקריב', scale: 2.2 },
];

interface Props {
  product: CatalogProduct;
  state: CustomizerState;
  kippahBaseHex?: string; // (לא בשימוש — נשמר לתאימות עם הקורא)
  onReset: () => void;
}

function symbolPreviewMarkup(id: string, color: string): string {
  const s = `stroke="${color}" stroke-width="2.2" fill="none" stroke-linejoin="round"`;
  switch (id) {
    case 'magen-david':
      return `<path d="M16 4 L26 21 L6 21 Z" ${s}/><path d="M16 28 L6 11 L26 11 Z" ${s}/>`;
    case 'crown':
      return `<path d="M5 23 L7 10 L12 17 L16 7 L20 17 L25 10 L27 23 Z" ${s}/>`;
    case 'chai':
      return `<text x="16" y="24" text-anchor="middle" font-family="serif" font-weight="700" font-size="22" fill="${color}">חי</text>`;
    case 'olive':
      return `<path d="M6 26 C12 18 18 12 26 6" ${s}/><ellipse cx="12" cy="18" rx="4" ry="2.2" transform="rotate(-40 12 18)" ${s}/><ellipse cx="18" cy="12" rx="4" ry="2.2" transform="rotate(-40 18 12)" ${s}/>`;
    case 'pomegranate':
      return `<circle cx="16" cy="19" r="8" ${s}/><path d="M12 12 L13.5 7 L16 10 L18.5 7 L20 12" ${s}/>`;
    default:
      return '';
  }
}

export function CustomizationPreview({ product, state, onReset }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState(ZOOM_VIEWS[0]);
  const showToast = useToastStore((s) => s.show);

  const cfg = product.customization!;
  const color = cfg.colors.find((c) => c.id === state.colorId) ?? cfg.colors[0];
  const font = cfg.fonts.find((f) => f.id === state.fontId) ?? cfg.fonts[0];
  const isKippah = product.iconKey === 'kippah';

  const mainText = state.text.trim();
  const dateText = state.date.trim();
  const dedicationText = state.dedication.trim();
  const secondLine = dedicationText || dateText;

  // מיקום אוטומטי מקצועי (viewBox 400×400)
  const anchor = isKippah ? { x: 200, y: 300 } : { x: 200, y: 220 };

  const downloadPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const svg64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 800;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = `emuna-bitachon-${product.slug}-preview.png`;
          a.click();
          showToast('ההדמיה ירדה למחשב 🎨');
        } catch {
          showToast('שמרו צילום מסך של ההדמיה 📸', 'info');
        }
      };
      img.onerror = () => showToast('שמרו צילום מסך של ההדמיה 📸', 'info');
      img.src = svg64;
    } catch {
      showToast('שמרו צילום מסך של ההדמיה 📸', 'info');
    }
  };

  const shareWhatsApp = () => {
    const parts = [
      `עיצוב אישי — ${product.titleHe}`,
      state.text && `טקסט: "${state.text}"`,
      state.dedication && `הקדשה: "${state.dedication}"`,
      `צבע: ${color.label} · גופן: ${font.label}`,
      `https://emuna-bitachon.vercel.app/product/${product.slug}`,
    ].filter(Boolean);
    window.open(`https://wa.me/?text=${encodeURIComponent(parts.join('\n'))}`, '_blank');
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gold/20 bg-navy-deep">
      {/* פס כלים */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/15 px-3 py-2">
        <div className="flex gap-1">
          {ZOOM_VIEWS.map((v) => (
            <button key={v.id} type="button" onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                view.id === v.id ? 'bg-gold text-navy font-bold' : 'text-cream/70 hover:text-gold'
              }`}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onReset} title="איפוס העיצוב" aria-label="איפוס העיצוב"
            className="rounded-full p-2 text-cream/70 hover:text-gold"><RotateCcw className="h-4 w-4" /></button>
          <button type="button" onClick={downloadPng} title="הורדת הדמיה" aria-label="הורדת הדמיה"
            className="rounded-full p-2 text-cream/70 hover:text-gold"><Download className="h-4 w-4" /></button>
          <button type="button" onClick={shareWhatsApp} title="שיתוף בוואטסאפ" aria-label="שיתוף בוואטסאפ"
            className="rounded-full p-2 text-cream/70 hover:text-gold"><Share2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* התצוגה — על גבי הצילום האמיתי */}
      <div className="relative overflow-hidden bg-white" style={{ aspectRatio: '1/1' }}>
        <div className="h-full w-full transition-transform duration-500"
          style={{ transform: `scale(${view.scale})`, transformOrigin: `${(anchor.x / 400) * 100}% ${(anchor.y / 400) * 100}%` }}>
          <svg ref={svgRef} viewBox="0 0 400 400" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* צל רך → הכיתוב קריא על כל צבע כיפה, ונראה כמו רקמה/הטבעה */}
              <filter id="emb-shadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="0.6" stdDeviation="1" floodColor="rgba(0,0,0,0.55)" />
              </filter>
              {/* קשת לאורך שולי הכיפה הקדמיים */}
              <path id="kippah-arc" d="M 96 296 Q 200 356 304 296" fill="none" />
            </defs>

            <rect width="400" height="400" fill="#ffffff" />
            {product.imageUrl && (
              <image href={product.imageUrl} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid meet" />
            )}

            {/* סמל — מרוכז מעל הכיתוב */}
            {state.symbolId && (
              <g transform={`translate(${anchor.x - 16} ${anchor.y - (isKippah ? 74 : 52)})`}
                dangerouslySetInnerHTML={{ __html: symbolPreviewMarkup(state.symbolId, color.hex) }} />
            )}
            {/* לוגו שהועלה */}
            {state.logoDataUrl && (
              <image href={state.logoDataUrl} x={anchor.x - 28} y={anchor.y - (isKippah ? 108 : 84)} width="56" height="56" preserveAspectRatio="xMidYMid meet" />
            )}

            {/* הכיתוב הראשי — קשת בכיפה, קו ישר במוצרים אחרים */}
            {mainText && isKippah && (
              <text fontFamily={font.cssFamily} fontWeight={font.cssWeight ?? 600}
                fontSize="26" fill={color.hex} filter="url(#emb-shadow)">
                <textPath href="#kippah-arc" startOffset="50%" textAnchor="middle">{mainText}</textPath>
              </text>
            )}
            {mainText && !isKippah && (
              <text x={anchor.x} y={anchor.y} textAnchor="middle" fontFamily={font.cssFamily}
                fontWeight={font.cssWeight ?? 600} fontSize="26" fill={color.hex} filter="url(#emb-shadow)">
                {mainText}
              </text>
            )}

            {/* שורה שנייה (הקדשה/תאריך) — מתחת, מרוכזת */}
            {secondLine && (
              <text x={anchor.x} y={isKippah ? 372 : anchor.y + 30} textAnchor="middle"
                fontFamily={font.cssFamily} fontSize="14" fill={color.hex} filter="url(#emb-shadow)" opacity="0.95">
                {secondLine}
              </text>
            )}
          </svg>
        </div>

        <span className="absolute bottom-2 start-2 flex items-center gap-1 rounded-full bg-navy/80 px-2.5 py-1 text-[10px] text-cream/70 backdrop-blur-sm">
          <Maximize2 className="h-3 w-3" /> תצוגה על המוצר · מיקום מקצועי אוטומטי
        </span>
      </div>
    </div>
  );
}
