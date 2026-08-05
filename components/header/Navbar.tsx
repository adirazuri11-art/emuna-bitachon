'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, Flame, Gift, Heart, Menu, Mic, Search, ShoppingBag, Sparkles, Truck, User, X,
} from 'lucide-react';
import { useCartStore, selectCartCount } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useUIStore } from '@/store/ui';
import { searchCatalog, type SearchResult } from '@/lib/search';
import { ACTIVE_CATEGORIES as CATALOG_CATEGORIES, getSubcategories } from '@/lib/catalog';
import { formatPrice, cn } from '@/lib/utils';

// ניווט נגזר ישירות מהקטלוג — קטגוריה חדשה בקטלוג מופיעה כאן אוטומטית
const CATEGORIES = CATALOG_CATEGORIES.map((c) => ({
  label: c.nameHe,
  href: `/category/${c.slug}`,
  slug: c.slug,
  subcategories: getSubcategories(c.slug),
}));

interface HebcalShabbatItem {
  category: string;
  hebrew?: string;
  date: string;
}

async function fetchTopBarData() {
  const today = new Date();
  const [shabbatRes, dateRes] = await Promise.all([
    fetch('https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on'),
    fetch(
      `https://www.hebcal.com/converter?cfg=json&gy=${today.getFullYear()}&gm=${today.getMonth() + 1}&gd=${today.getDate()}&g2h=1`
    ),
  ]);
  const shabbat = (await shabbatRes.json()) as { items: HebcalShabbatItem[] };
  const hebDate = (await dateRes.json()) as { hebrew?: string };

  const toTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })
      : null;

  return {
    hebrewDate: hebDate.hebrew ?? null,
    candles: toTime(shabbat.items?.find((i) => i.category === 'candles')?.date),
    parsha: shabbat.items?.find((i) => i.category === 'parashat')?.hebrew ?? null,
  };
}

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const cartCount = useCartStore(selectCartCount);
  const wishlistCount = useWishlistStore((s) => s.slugs.length);
  const { openCart } = useUIStore();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // נעילת גלילת הגוף כשהתפריט הנייד פתוח — כדי שהגלילה תתבצע בתוך התפריט,
  // ולא ב"עמוד מאחוריו" (הבאג שבו הדף גלל במקום התפריט).
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const { data: topBar } = useQuery({
    queryKey: ['hebcal-topbar'],
    queryFn: fetchTopBarData,
    staleTime: 60 * 60 * 1000,
  });

  // השלמה אוטומטית — debounce קצר, חיפוש מקומי מהיר
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const results = searchCatalog(value, 5);
      setSuggestions(results);
      setSuggestionsOpen(results.length > 0);
    }, 140);
  };

  const goToSearch = (q: string) => {
    setSuggestionsOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      router.push(`/product/${suggestions[activeIndex].product.slug}`);
      setSuggestionsOpen(false);
    } else {
      goToSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestionsOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40">
      {/* ===== Top Bar ===== */}
      <div className="bg-navy-deep text-cream/80">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            <span>{topBar?.hebrewDate ?? 'לוח עברי'}</span>
            {topBar?.parsha && <span className="hidden text-cream/50 sm:inline">· {topBar.parsha}</span>}
          </div>
          <div className="flex items-center gap-4">
            {topBar?.candles && (
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-gold" />
                הדלקת נרות (י-ם): <b className="text-gold">{topBar.candles}</b>
              </span>
            )}
            <span className="hidden items-center gap-1.5 md:flex">
              <Truck className="h-3.5 w-3.5 text-gold" />
              משלוח חינם בהזמנה מעל ₪399
            </span>
            <Link href="/gift-card" className="flex items-center gap-1.5 font-medium text-gold transition-colors hover:text-gold-light">
              <Gift className="h-3.5 w-3.5" /> שובר מתנה
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Main Bar ===== */}
      <div className={cn('border-b border-gold/15 transition-all duration-300', scrolled ? 'glass shadow-card' : 'bg-cream')}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <button className="rounded-lg p-2 text-navy hover:bg-navy/5 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)} aria-label="תפריט" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="shrink-0 text-center leading-none">
            <span className="font-display text-2xl font-bold text-navy">
              אמונה <span className="gold-text">וביטחון</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-medium text-gold-soft">
              יודאיקה יוקרתית · מדור לדור
            </span>
          </Link>

          {/* חיפוש חכם עם השלמה אוטומטית */}
          <div className="relative mx-auto hidden max-w-xl flex-1 md:block">
            <form onSubmit={handleSearch} role="search">
              <input
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 160)}
                placeholder='חיפוש חכם: "כוס קידוש מכסף לחתן, עד 500 ₪"'
                aria-label="חיפוש מוצרים"
                aria-expanded={suggestionsOpen}
                className="gold-ring w-full rounded-full bg-white py-2.5 pe-4 ps-24 text-sm outline-none placeholder:text-navy/40 focus:shadow-gold"
              />
              <div className="absolute inset-y-0 start-1.5 flex items-center gap-1">
                <button type="submit" aria-label="חיפוש"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-navy/50 transition-colors hover:text-gold">
                  <Search className="h-4 w-4" />
                </button>
                <Mic className="h-4 w-4 text-navy/25" aria-hidden />
              </div>
            </form>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {suggestionsOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-2xl"
                  role="listbox"
                >
                  {suggestions.map(({ product }, i) => (
                    <li key={product.id} role="option" aria-selected={i === activeIndex}>
                      <Link href={`/product/${product.slug}`}
                        onClick={() => setSuggestionsOpen(false)}
                        className={cn('flex items-center gap-3 px-3 py-2 transition-colors',
                          i === activeIndex ? 'bg-gold/10' : 'hover:bg-cream')}>
                        <div className="relative h-11 w-9 flex-shrink-0">
                          <Image src={product.imageUrl!} alt={product.titleHe} fill className="rounded-lg object-cover" sizes="36px" />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-navy">{product.titleHe}</span>
                          <span className="text-xs text-gold-soft">{product.category}</span>
                        </span>
                        <span className="text-sm font-bold text-navy">
                          {formatPrice(product.discountPrice ?? product.basePrice)}
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li className="border-t border-navy/5">
                    <button onMouseDown={() => goToSearch(query.trim())}
                      className="w-full px-3 py-2 text-center text-xs font-medium text-gold-soft hover:bg-cream">
                      כל התוצאות עבור "{query}" ←
                    </button>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="ms-auto flex items-center gap-1 md:ms-0">
            <Link href="/gift-card" aria-label="שובר מתנה" title="שובר מתנה"
              className="rounded-full p-2.5 text-navy transition-colors hover:bg-navy/5 hover:text-gold">
              <Gift className="h-5 w-5" />
            </Link>
            <button className="hidden rounded-full p-2.5 text-navy transition-colors hover:bg-navy/5 hover:text-gold sm:block"
              aria-label="החשבון שלי">
              <User className="h-5 w-5" />
            </button>
            <Link href="/wishlist" aria-label="המועדפים שלי"
              className="relative rounded-full p-2.5 text-navy transition-colors hover:bg-navy/5 hover:text-gold">
              <Heart className="h-5 w-5" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-gold">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button onClick={openCart} aria-label="סל הקניות"
              className="relative rounded-full p-2.5 text-navy transition-colors hover:bg-navy/5 hover:text-gold">
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {mounted && cartCount > 0 && (
                  <motion.span key={cartCount}
                    initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
                    className="absolute -end-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-navy">
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ===== Categories + תפריט-על ===== */}
        <nav className="hidden justify-center gap-6 border-t border-gold/10 py-2.5 lg:flex" aria-label="קטגוריות">
          <Link href="/blog"
            className="relative text-sm font-medium text-navy/80 transition-colors hover:text-navy">
            בלוג
            <span className="absolute -bottom-1 end-0 start-0 h-px scale-x-0 bg-gradient-to-l from-gold to-gold-soft transition-transform duration-300 hover:scale-x-100" />
          </Link>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.href}
              className="group relative"
              onMouseEnter={() => setOpenCategoryDropdown(cat.slug)}
              onMouseLeave={() => setOpenCategoryDropdown(null)}>
              <Link href={cat.href}
                onClick={() => setOpenCategoryDropdown(null)}
                className="relative text-sm font-medium text-navy/80 transition-colors hover:text-navy">
                {cat.label}
                <span className="absolute -bottom-1 end-0 start-0 h-px scale-x-0 bg-gradient-to-l from-gold to-gold-soft transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
              {cat.subcategories.length > 1 && openCategoryDropdown === cat.slug && (
                <div className="absolute start-1/2 top-full z-50 -translate-x-1/2 pt-3">
                  <div className="min-w-[180px] rounded-2xl border border-gold/20 bg-white p-2 shadow-2xl">
                    {cat.subcategories.map((sub) => (
                      <Link key={sub} href={`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`}
                        onClick={() => setOpenCategoryDropdown(null)}
                        className="block rounded-lg px-3 py-2 text-sm text-navy/75 transition-colors hover:bg-gold/10 hover:text-navy">
                        {sub}
                      </Link>
                    ))}
                    <Link href={cat.href}
                      onClick={() => setOpenCategoryDropdown(null)}
                      className="mt-1 block border-t border-navy/5 px-3 pb-1 pt-2 text-xs font-bold text-gold-soft hover:text-navy">
                      לכל {cat.label} ←
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
              className="border-t border-gold/10 bg-cream lg:hidden" aria-label="קטגוריות">
              <div className="flex max-h-[calc(100dvh-104px)] flex-col overflow-y-auto overscroll-contain px-4 py-2 pb-8">
                {/* חיפוש במובייל */}
                <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) { setMobileOpen(false); goToSearch(query.trim()); } }}
                  className="relative py-3" role="search">
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="חיפוש מוצרים..." aria-label="חיפוש מוצרים"
                    className="gold-ring w-full rounded-full bg-white py-2.5 pe-10 ps-4 text-sm outline-none" />
                  <button type="submit" aria-label="חיפוש" className="absolute end-3 top-1/2 -translate-y-1/2 text-gold-soft">
                    <Search className="h-4 w-4" />
                  </button>
                </form>
                <Link href="/blog" onClick={() => setMobileOpen(false)}
                  className="border-b border-navy/5 py-3 text-sm font-medium text-navy/80">
                  בלוג
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link key={cat.href} href={cat.href} onClick={() => setMobileOpen(false)}
                    className="border-b border-navy/5 py-3 text-sm font-medium text-navy/80">
                    {cat.label}
                  </Link>
                ))}
                <Link href="/wishlist" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-3 text-sm font-medium text-navy/80">
                  <Heart className="h-4 w-4 text-gold-soft" /> המועדפים שלי
                </Link>
                <Link href="/gift-card" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-3 text-sm font-medium text-navy/80">
                  <Gift className="h-4 w-4 text-gold-soft" /> שובר מתנה
                </Link>
                <Link href="/gift-finder" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-3 text-sm font-medium text-navy/80">
                  <Sparkles className="h-4 w-4 text-gold-soft" /> מאתר המתנה המושלמת
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
