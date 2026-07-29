'use client';

// אזור "מסורת חיה" — ספר תורה נפתח/נסגר במרכז, מוקף אלמנטים יהודיים מונפשים:
// מנורת שבעה קנים עם להבות מרצדות, סביבון מסתובב, ונרות שבת.
// כל האנימציות עדינות ומכבדות prefers-reduced-motion (MotionConfig גלובלי).

import { motion } from 'framer-motion';
import { SeferTorahScroll } from './SeferTorahScroll';

function Flame({ x, y, scale = 1, delay = 0 }: { x: number; y: number; scale?: number; delay?: number }) {
  return (
    <motion.path
      d={`M${x} ${y} C${x - 5 * scale} ${y + 9 * scale} ${x - 3 * scale} ${y + 16 * scale} ${x} ${y + 19 * scale} C${x + 3 * scale} ${y + 16 * scale} ${x + 5 * scale} ${y + 9 * scale} ${x} ${y} Z`}
      fill="#F8C144"
      animate={{ scaleY: [1, 1.18, 0.94, 1], opacity: [0.85, 1, 0.8, 0.85] }}
      transition={{ duration: 1.4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ transformOrigin: `${x}px ${y + 19}px` }}
    />
  );
}

function Menorah() {
  // שבעה קנים סימטריים; קצות הקנים ישרים בגובה 92, גביעים ולהבות מעליהם.
  const tops = [30, 55, 80, 100, 120, 145, 170];
  return (
    <svg viewBox="0 0 200 190" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="menoGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B58A2C" /><stop offset="0.5" stopColor="#F2DE9E" /><stop offset="1" stopColor="#8F6B1B" />
        </linearGradient>
      </defs>
      <g stroke="url(#menoGold)" strokeWidth="7" fill="none" strokeLinecap="round">
        <path d="M100 158 L100 92" />
        <path d="M100 132 A34 34 0 0 0 66 98 L66 92" />
        <path d="M100 122 A55 55 0 0 0 45 78 L45 92" />
        <path d="M100 112 A78 78 0 0 0 22 60 L22 92" />
        <path d="M100 132 A34 34 0 0 1 134 98 L134 92" />
        <path d="M100 122 A55 55 0 0 1 155 78 L155 92" />
        <path d="M100 112 A78 78 0 0 1 178 60 L178 92" />
      </g>
      {/* בסיס */}
      <rect x="84" y="156" width="32" height="12" rx="3" fill="url(#menoGold)" />
      <path d="M74 168 L126 168 L138 182 L62 182 Z" fill="url(#menoGold)" />
      <ellipse cx="100" cy="182" rx="42" ry="5" fill="#8F6B1B" opacity="0.6" />
      {/* גביעים + להבות */}
      {tops.map((x, i) => (
        <g key={x}>
          <rect x={x - 6} y={84} width="12" height="9" rx="2" fill="url(#menoGold)" />
          <Flame x={x} y={64} scale={0.95} delay={i * 0.1} />
        </g>
      ))}
    </svg>
  );
}

function SpinningDreidel() {
  return (
    <motion.svg
      viewBox="0 0 120 160" className="h-full w-full" xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: [0, 360], y: [0, -4, 0] }}
      transition={{ rotate: { duration: 2.4, repeat: Infinity, ease: 'linear' }, y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } }}
      style={{ transformOrigin: '60px 90px' }}
    >
      <defs>
        <linearGradient id="drGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B58A2C" /><stop offset="0.5" stopColor="#F2DE9E" /><stop offset="1" stopColor="#8F6B1B" />
        </linearGradient>
      </defs>
      <rect x="52" y="24" width="16" height="34" rx="5" fill="url(#drGold)" />
      <path d="M32 58 L88 58 L60 118 Z" fill="url(#drGold)" />
      <path d="M32 58 L88 58 L88 70 L32 70 Z" fill="#00000022" />
      <text x="60" y="96" textAnchor="middle" fontFamily="'Frank Ruhl Libre',serif" fontSize="30" fontWeight="700" fill="#3A2C14">נ</text>
    </motion.svg>
  );
}

function ShabbatCandles() {
  return (
    <svg viewBox="0 0 160 180" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cndSilver" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8E9CAC" /><stop offset="0.4" stopColor="#FFFFFF" /><stop offset="1" stopColor="#8C99A9" />
        </linearGradient>
      </defs>
      {[52, 108].map((x, i) => (
        <g key={x}>
          <Flame x={x} y={30} scale={1} delay={i * 0.3} />
          <rect x={x - 7} y="52" width="14" height="46" rx="3" fill="#FBF7EC" />
          <path d={`M${x - 16} 100 L${x + 16} 100 L${x + 12} 120 L${x - 12} 120 Z`} fill="url(#cndSilver)" />
          <ellipse cx={x} cy="150" rx="26" ry="7" fill="url(#cndSilver)" />
          <path d={`M${x - 6} 122 L${x - 20} 148 L${x + 20} 148 L${x + 6} 122 Z`} fill="url(#cndSilver)" />
        </g>
      ))}
    </svg>
  );
}

export function LivingTradition() {
  return (
    <section className="relative overflow-hidden bg-navy-deep py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute start-1/4 top-0 h-72 w-72 rounded-full bg-gold/10 blur-[110px]" />
        <div className="absolute bottom-0 end-1/4 h-64 w-64 rounded-full bg-gold-soft/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mb-6 text-center">
          <span className="text-sm font-medium text-gold">אמונה שחיה בכל חפץ</span>
          <h2 className="mt-1 font-display text-3xl font-bold text-cream md:text-4xl">מסורת חיה</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-cream/60">
            מספר התורה שנפתח בבית הכנסת ועד נרות השבת בבית — כל פריט אצלנו נושא רגע של קדושה.
            <span className="mt-1 block text-xs text-cream/40">(לחצו על ספר התורה כדי לפתוח ולסגור)</span>
          </p>
        </div>

        <SeferTorahScroll />

        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { el: <Menorah />, label: 'מנורת המקדש' },
            { el: <SpinningDreidel />, label: 'נס חנוכה' },
            { el: <ShabbatCandles />, label: 'נרות שבת' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gold/15 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="h-24 w-24 sm:h-28 sm:w-28">{item.el}</div>
              <span className="text-xs font-medium text-cream/70">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
