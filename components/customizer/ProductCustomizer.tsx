'use client';

// ============================================================
// הקסטומייזר המלא: טקסט, תאריך, הקדשה, אירוע, גופן, צבע, מיקום,
// סמל, לוגו, אריזה, כמות — עם תצוגה חיה, ולידציה ותמחור דינמי.
// שמירת עיצוב ב-localStorage להמשך עריכה מאוחר יותר.
// ============================================================

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, Check, ImagePlus, Minus, Plus, Save, ShoppingBag, X } from 'lucide-react';
import { METHOD_LABELS, type CatalogProduct } from '@/lib/catalog';
import { computePrice, nextBulkTier } from '@/lib/pricing';
import { formatPrice } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { useCartStore } from '@/store/cart';
import { useToastStore } from '@/store/toast';
import { CustomizationPreview } from './CustomizationPreview';
import { SymbolIcon } from './SymbolIcon';
import { emptyCustomizerState, type CustomizerState } from './customizer-types';

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg'];
const MIN_LOGO_WIDTH = 400;

interface Props {
  product: CatalogProduct;
  variantSelections: Record<string, string>;
}

export function ProductCustomizer({ product, variantSelections }: Props) {
  const cfg = product.customization!;
  const storageKey = `emuna-design-${product.slug}`;
  const defaults = {
    fontId: cfg.fonts[0].id,
    colorId: cfg.colors[0].id,
    positionId: cfg.positions[0].id,
  };

  const [state, setState] = useState<CustomizerState>(() => ({
    ...emptyCustomizerState(defaults),
    ...(cfg.minOrderQty ? { quantity: cfg.minOrderQty } : {}),
  }));
  const [logoWarning, setLogoWarning] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = useCartStore((s) => s.addItem);
  const setQuantityInCart = useCartStore((s) => s.setQuantity);
  const showToast = useToastStore((s) => s.show);

  // המשך עריכה מאוחר יותר — טעינת עיצוב שמור
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CustomizerState>;
        setState((s) => {
          const merged = { ...s, ...parsed, logoDataUrl: null, logoName: null };
          if (cfg.minOrderQty && merged.quantity < cfg.minOrderQty) merged.quantity = cfg.minOrderQty;
          return merged;
        });
      }
    } catch {
      /* עיצוב שמור פגום — מתעלמים */
    }
  }, [storageKey]);

  const patch = (p: Partial<CustomizerState>) => setState((s) => ({ ...s, ...p }));

  const saveDesign = () => {
    const { logoDataUrl: _l, logoName: _n, ...persistable } = state;
    localStorage.setItem(storageKey, JSON.stringify(persistable));
    showToast('העיצוב נשמר — אפשר לחזור אליו בכל זמן 💾');
  };

  const resetDesign = () => {
    setState(emptyCustomizerState(defaults));
    setLogoWarning(null);
    localStorage.removeItem(storageKey);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoWarning(null);

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoWarning('פורמט לא נתמך — יש להעלות PNG או JPG בלבד.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoWarning('הקובץ גדול מ-2MB. יש לצמצם את גודל הקובץ.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width < MIN_LOGO_WIDTH) {
          setLogoWarning(
            `שימו לב: רוחב הקובץ ${img.width}px — באיכות נמוכה התוצאה עלולה להיראות מטושטשת. מומלץ קובץ ברוחב ${MIN_LOGO_WIDTH}px לפחות.`
          );
        }
        patch({ logoDataUrl: dataUrl, logoName: file.name });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // צבע הכיפה מהווריאציה — מזין את התצוגה החיה
  const kippahBaseHex = useMemo(() => {
    const group = product.variantGroups?.find((g) => g.id === 'base-color');
    return group?.options.find((o) => o.id === variantSelections['base-color'])?.hex;
  }, [product.variantGroups, variantSelections]);

  const price = computePrice({
    product,
    variantSelections,
    customization: {
      text: state.text || state.dedication,
      symbolId: state.symbolId ?? undefined,
      hasLogo: Boolean(state.logoDataUrl),
      giftWrap: state.giftWrap,
      matchingBag: state.matchingBag,
    },
    quantity: state.quantity,
  });
  const nextTier = nextBulkTier(product, state.quantity);

  const textTooLong = state.text.length > cfg.maxChars;
  const dedicationTooLong = state.dedication.length > cfg.maxChars + 10;
  const canAdd = !textTooLong && !dedicationTooLong;

  const handleAddToCart = () => {
    if (!canAdd) return;
    const unit = Math.round(price.total / price.quantity);
    const customization: Record<string, string> = {
      שיטה: METHOD_LABELS[cfg.method],
      ...(state.eventType && { אירוע: state.eventType }),
      ...(state.text && { טקסט: state.text }),
      ...(state.date && { תאריך: state.date }),
      ...(state.dedication && { הקדשה: state.dedication }),
      גופן: cfg.fonts.find((f) => f.id === state.fontId)?.label ?? '',
      צבע: cfg.colors.find((c) => c.id === state.colorId)?.label ?? '',
      ...(state.symbolId && { סמל: cfg.symbols?.find((s) => s.id === state.symbolId)?.label ?? '' }),
      ...(state.logoName && { 'קובץ לוגו': state.logoName }),
      ...(state.giftWrap && { אריזה: 'אריזת מתנה' }),
      ...(state.matchingBag && { תוספת: 'נרתיק עם רקמה תואמת' }),
      ...(state.notes && { הערות: state.notes }),
      ...Object.fromEntries(
        (product.variantGroups ?? []).map((g) => [
          g.label,
          g.options.find((o) => o.id === variantSelections[g.id])?.label ?? '',
        ])
      ),
    };

    // פריט מותאם אישית = שורה נפרדת בסל (לא מתמזג עם פריטים אחרים)
    const itemId = `${product.id}-custom-${Date.now()}`;
    addItem({ id: itemId, title: `${product.titleHe} · בהתאמה אישית`, price: unit, customization });
    if (state.quantity > 1) setQuantityInCart(itemId, state.quantity);

    trackEvent('add_to_cart', {
      value: price.total,
      items: [{ id: product.id, name: product.titleHe, price: unit, quantity: state.quantity }],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    showToast(`נוסף לסל עם ההתאמה האישית שלך ✓`);
  };

  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition-colors ${
      active
        ? 'border-gold bg-gold/15 font-bold text-navy'
        : 'border-navy/15 text-navy/70 hover:border-gold/60'
    }`;

  return (
    <section aria-label="התאמה אישית" className="rounded-2xl border border-gold/25 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-navy">
          {METHOD_LABELS[cfg.method]} אישית
        </h2>
        <button type="button" onClick={saveDesign}
          className="flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-medium text-navy hover:bg-gold/10">
          <Save className="h-3.5 w-3.5" /> שמירת העיצוב
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* התצוגה החיה */}
        <CustomizationPreview product={product} state={state} kippahBaseHex={kippahBaseHex} onReset={resetDesign} />

        {/* הטופס */}
        <div className="space-y-4">
          {cfg.eventTypes && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">סוג האירוע</span>
              <select value={state.eventType} onChange={(e) => patch({ eventType: e.target.value })}
                className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none">
                <option value="">בחירה (לא חובה)</option>
                {cfg.eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          )}

          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-medium text-navy">
              <span>שם / טקסט ל{METHOD_LABELS[cfg.method]}</span>
              <span className={textTooLong ? 'font-bold text-red-600' : 'text-navy/40'}>
                {state.text.length}/{cfg.maxChars}
              </span>
            </span>
            <input value={state.text} dir="rtl" maxLength={cfg.maxChars + 5}
              onChange={(e) => patch({ text: e.target.value })}
              placeholder='למשל: "דוד בן אברהם"'
              className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            {textTooLong && (
              <span className="mt-1 block text-xs text-red-600">חריגה ממגבלת התווים — קצרו את הטקסט.</span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">תאריך (לא חובה)</span>
              <input value={state.date} dir="rtl" maxLength={18}
                onChange={(e) => patch({ date: e.target.value })}
                placeholder='כ"ה באלול תשפ"ו'
                className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">הקדשה קצרה</span>
              <input value={state.dedication} dir="rtl" maxLength={cfg.maxChars + 12}
                onChange={(e) => patch({ dedication: e.target.value })}
                placeholder='"באהבה, סבא וסבתא"'
                className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            </label>
          </div>

          {cfg.versePresets && (
            <div className="flex flex-wrap gap-1.5">
              {cfg.versePresets.map((v) => (
                <button key={v} type="button" onClick={() => patch({ dedication: v })}
                  className={pill(state.dedication === v)}>
                  {v}
                </button>
              ))}
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-sm font-medium text-navy">גופן</span>
            <div className="flex flex-wrap gap-1.5">
              {cfg.fonts.map((f) => (
                <button key={f.id} type="button" onClick={() => patch({ fontId: f.id })} className={pill(state.fontId === f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-navy">
              צבע ה{METHOD_LABELS[cfg.method]}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {cfg.colors.map((c) => (
                <button key={c.id} type="button" onClick={() => patch({ colorId: c.id })}
                  title={c.label} aria-label={c.label}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    state.colorId === c.id ? 'scale-110 border-navy' : 'border-navy/10 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }} />
              ))}
              <span className="text-xs text-navy/50">
                {cfg.colors.find((c) => c.id === state.colorId)?.label}
              </span>
            </div>
          </div>

          {/* המיקום נקבע אוטומטית למקום המקצועי ביותר — הלקוח לא בוחר */}
          {cfg.symbols && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-navy">
                סמל מהגלריה {cfg.surcharges.symbol > 0 && <span className="text-navy/40">(+{formatPrice(cfg.surcharges.symbol)})</span>}
              </span>
              <div className="flex flex-wrap gap-2">
                {cfg.symbols.map((s) => (
                  <button key={s.id} type="button" title={s.label} aria-label={s.label}
                    onClick={() => patch({ symbolId: state.symbolId === s.id ? null : s.id })}
                    className={`rounded-xl border p-2 transition-colors ${
                      state.symbolId === s.id ? 'border-gold bg-gold/15' : 'border-navy/10 hover:border-gold/50'
                    }`}>
                    <SymbolIcon id={s.id} color="#0B132B" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {cfg.allowLogoUpload && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-navy">
                לוגו / קובץ אישי {cfg.surcharges.logo > 0 && <span className="text-navy/40">(+{formatPrice(cfg.surcharges.logo)})</span>}
              </span>
              {state.logoDataUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-navy/10 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={state.logoDataUrl} alt="הלוגו שהועלה" className="h-10 w-10 rounded object-contain" />
                  <span className="flex-1 truncate text-xs text-navy/70">{state.logoName}</span>
                  <button type="button" aria-label="הסרת הלוגו"
                    onClick={() => { patch({ logoDataUrl: null, logoName: null }); setLogoWarning(null); }}
                    className="p-1 text-navy/40 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-navy/20 py-3 text-sm text-navy/60 hover:border-gold hover:text-navy">
                  <ImagePlus className="h-4 w-4" /> העלאת PNG / JPG (עד 2MB)
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
              {logoWarning && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {logoWarning}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-navy">
              <input type="checkbox" checked={state.giftWrap} onChange={(e) => patch({ giftWrap: e.target.checked })}
                className="h-4 w-4 accent-[#D4AF37]" />
              אריזת מתנה יוקרתית (+{formatPrice(cfg.surcharges.giftWrap)})
            </label>
            {cfg.surcharges.matchingBag && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-navy">
                <input type="checkbox" checked={state.matchingBag} onChange={(e) => patch({ matchingBag: e.target.checked })}
                  className="h-4 w-4 accent-[#D4AF37]" />
                נרתיק עם רקמה תואמת (+{formatPrice(cfg.surcharges.matchingBag)})
              </label>
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">הערות מיוחדות להזמנה</span>
            <textarea value={state.notes} dir="rtl" rows={2} maxLength={200}
              onChange={(e) => patch({ notes: e.target.value })}
              className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
          </label>

          {/* כמות + הנחת כמות */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-navy">כמות</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="הפחתת כמות"
                onClick={() => patch({ quantity: Math.max(cfg.minOrderQty ?? 1, state.quantity - 1) })}
                className="rounded-full border border-navy/15 p-1.5 hover:border-gold"><Minus className="h-3.5 w-3.5" /></button>
              <input type="number" min={cfg.minOrderQty ?? 1} max={2000} value={state.quantity}
                onChange={(e) => {
                  // הקלדה חופשית: מגבילים רק ל-1..2000, בלי לכפות מינימום תוך כדי הקלדה
                  const v = Math.min(2000, Math.max(1, Math.floor(Number(e.target.value)) || 1));
                  patch({ quantity: v });
                }}
                onBlur={() => {
                  const min = cfg.minOrderQty ?? 1;
                  if (state.quantity < min) patch({ quantity: min });
                }}
                aria-label="כמות"
                className="w-20 rounded-lg border border-navy/15 py-1 text-center text-sm outline-none focus:border-gold" />
              <button type="button" aria-label="הוספת כמות"
                onClick={() => patch({ quantity: state.quantity + 1 })}
                className="rounded-full border border-navy/15 p-1.5 hover:border-gold"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            {price.bulkDiscountPct > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                {price.bulkDiscountPct}% הנחת כמות
              </span>
            )}
          </div>
          {cfg.minOrderQty && (
            <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs font-medium text-navy">
              ✷ הטבעה אישית מתבצעת בהזמנת כמות — מינימום {cfg.minOrderQty} יחידות.
            </p>
          )}
          {(cfg.bulkDiscounts?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-navy/60">הנחת כמות — ככל שמזמינים יותר, חוסכים יותר:</p>
              <div className="flex flex-wrap gap-1.5">
                {cfg.bulkDiscounts.map((d) => {
                  const active = state.quantity >= d.minQty;
                  return (
                    <span key={d.minQty}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                        active ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-700' : 'border-navy/15 text-navy/50'
                      }`}>
                      {d.minQty}+ יח׳ → {d.pct}% הנחה
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {nextTier && (
            <p className="text-xs text-gold-soft">
              💡 עוד {nextTier.minQty - state.quantity} יחידות ותקבלו {nextTier.pct}% הנחה
            </p>
          )}

          {/* פירוט מחיר דינמי */}
          <div className="rounded-xl bg-cream p-3">
            <dl className="space-y-1 text-sm">
              {price.lines.map((l) => (
                <div key={l.label} className="flex justify-between text-navy/70">
                  <dt>{l.label}</dt>
                  <dd>{l.amount < 0 ? '‎-' : ''}{formatPrice(Math.abs(l.amount))}</dd>
                </div>
              ))}
              {price.quantity > 1 && (
                <div className="flex justify-between text-navy/70">
                  <dt>× {price.quantity} יחידות</dt>
                  <dd>{formatPrice(price.subtotal)}</dd>
                </div>
              )}
              {price.discountAmount > 0 && (
                <div className="flex justify-between font-medium text-emerald-700">
                  <dt>הנחת כמות ({price.bulkDiscountPct}%)</dt>
                  <dd>‎-{formatPrice(price.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-navy/10 pt-1.5 text-base font-bold text-navy">
                <dt>סה"כ</dt>
                <dd>{formatPrice(price.total)}</dd>
              </div>
            </dl>
          </div>

          <button type="button" onClick={handleAddToCart} disabled={!canAdd}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3 font-bold transition-all ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-l from-gold to-gold-soft text-navy shadow-gold hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100'
            }`}>
            {added ? (<><Check className="h-5 w-5" /> נוסף לסל עם ההתאמה</>) : (<><ShoppingBag className="h-5 w-5" /> הוספה לסל · {formatPrice(price.total)}</>)}
          </button>
        </div>
      </div>
    </section>
  );
}
