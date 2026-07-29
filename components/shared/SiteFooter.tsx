import Link from 'next/link';
import { ACTIVE_CATEGORIES as CATEGORIES } from '@/lib/catalog';
import { NewsletterForm } from '@/components/shared/NewsletterForm';

// פוטר עשיר: קטגוריות, כלים, מועדון, דפים משפטיים
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-gold/20 bg-navy-deep text-cream/70">
      {/* מועדון */}
      <div className="border-b border-gold/10 py-10 text-center">
        <h2 className="font-display text-xl font-bold text-cream">מצטרפים למועדון אמונה וביטחון</h2>
        <p className="mb-5 mt-1 text-sm text-cream/50">קולקציות חדשות, מבצעי חגים והטבות למצטרפים — בלי ספאם.</p>
        <NewsletterForm />
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="font-display text-2xl font-bold text-cream">
            אמונה <span className="gold-text">וביטחון</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/50">
            בית יודאיקה ישראלי: כלי קודש, טליתות ומתנות עם נשמה — בעבודת יד, עם התאמה אישית מלאה
            ואישורי כשרות מאומתים.
          </p>
        </div>

        <nav aria-label="קטגוריות בפוטר">
          <p className="mb-3 text-sm font-bold text-gold">הקטגוריות</p>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="transition-colors hover:text-gold">{c.nameHe}</Link>
              </li>
            ))}
            <li>
              <Link href="/search" className="text-gold/70 transition-colors hover:text-gold">לכל הקטגוריות →</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="כלים ושירותים">
          <p className="mb-3 text-sm font-bold text-gold">שירותים</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/gift-finder" className="transition-colors hover:text-gold">מאתר המתנה</Link></li>
            <li><Link href="/gift-card" className="transition-colors hover:text-gold">שובר מתנה</Link></li>
            <li><Link href="/quote" className="transition-colors hover:text-gold">הזמנות בכמות</Link></li>
            <li><Link href="/wishlist" className="transition-colors hover:text-gold">המועדפים</Link></li>
            <li><Link href="/accessibility" className="transition-colors hover:text-gold">נגישות</Link></li>
          </ul>
        </nav>

        <nav aria-label="דפים משפטיים">
          <p className="mb-3 text-sm font-bold text-gold">משפטי</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="transition-colors hover:text-gold">תנאים וסוג</Link></li>
            <li><Link href="/privacy" className="transition-colors hover:text-gold">פרטיות</Link></li>
            <li><Link href="/returns" className="transition-colors hover:text-gold">החזרות ומשלוח</Link></li>
            <li><Link href="/cookies" className="transition-colors hover:text-gold">מדיניות Cookies</Link></li>
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-sm font-bold text-gold">שירות אישי</p>
          <p className="text-sm leading-relaxed text-cream/50">
            מתלבטים? כתבו לנו בוואטסאפ — עונה לכם אדם אמיתי.
          </p>
          <p className="mt-4 text-xs text-cream/35">
            משלוח חינם מ-₪399 · החזרות עד 30 יום
          </p>
        </div>
      </div>

      <div className="border-t border-gold/10 py-4 text-center text-xs text-cream/40">
        <p>© אמונה וביטחון · יודאיקה יוקרתית מדור לדור · ישראל</p>
        <p className="mt-1.5 text-[11px] text-cream/30">
          עוצב ופותח ע"י{' '}
          <a
            href="https://wa.me/972503096969"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-soft/70 transition-colors hover:text-gold"
          >
            אדיר עזורי · ללב מדיה
          </a>{' '}
          — בנייה ושיווק שוטף
        </p>
      </div>
    </footer>
  );
}
