'use client';

// בועה צפה למאתר המתנות — נשארת לאורך כל הגלילה, לחיצה מובילה ישר
// ל"לא יודעים מה לקנות?" (/gift-finder). ממוקמת מעל כפתור הוואטסאפ.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export function GiftFinderBubble() {
  const pathname = usePathname();
  // לא מציגים בתוך מאתר המתנות עצמו
  if (pathname?.startsWith('/gift-finder')) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 18 }}
      className="fixed bottom-24 right-6 z-40 hidden md:block"
    >
      <Link
        href="/gift-finder"
        aria-label="מאתר המתנה המושלמת — לא יודעים מה לקנות?"
        className="group flex items-center gap-2 rounded-full border border-gold/50 bg-navy py-2.5 pe-3 ps-2.5 shadow-gold transition-transform hover:scale-105"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-l from-gold to-gold-soft text-lg">
          🎁
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-gold/30" />
        </span>
        {/* התווית נפתחת ברחיפה בדסקטופ, ומוסתרת במובייל לחיסכון במקום */}
        <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold text-cream transition-all duration-300 group-hover:max-w-[140px] group-hover:pe-1 md:inline-block">
          מתנה מושלמת?
        </span>
      </Link>
    </motion.div>
  );
}
