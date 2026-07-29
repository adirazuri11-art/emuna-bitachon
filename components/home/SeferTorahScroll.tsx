'use client';

// ============================================================
// ספר תורה שנפתח ונסגר — אנימציית SVG + Framer Motion.
// לולאה אוטומטית (פתוח → החזק → סגור), וגם לחיצה/מקלדת לפתיחה ידנית.
// מכבד prefers-reduced-motion (דרך MotionConfig הגלובלי) — במצב מופחת
// מוצג פתוח וסטטי.
// ============================================================

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// עמודי כתיבה מסוגננים (קווי דיו) — מרמזים על כתב סת"ם בלי טקסט זעיר ובלתי קריא
const COLUMN_LINES = Array.from({ length: 9 }, (_, i) => i);

function ScrollColumn({ x, delay }: { x: number; delay: number }) {
  return (
    <g transform={`translate(${x} 96)`}>
      {COLUMN_LINES.map((i) => (
        <motion.line
          key={i}
          x1={0}
          x2={54}
          y1={i * 12}
          y2={i * 12}
          stroke="#3A2C14"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 0.5, delay: delay + i * 0.05 }}
        />
      ))}
    </g>
  );
}

export function SeferTorahScroll() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  // לולאה אוטומטית
  useEffect(() => {
    if (reduce) {
      setOpen(true);
      return;
    }
    setOpen(true);
    const id = setInterval(() => setOpen((o) => !o), 4200);
    return () => clearInterval(id);
  }, [reduce]);

  const rollerGap = open ? 150 : 8; // חצי-מרחק בין העצי חיים

  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-label={open ? 'סגירת ספר התורה' : 'פתיחת ספר התורה'}
      className="mx-auto block w-full max-w-2xl cursor-pointer rounded-2xl focus-visible:outline-gold"
    >
      <svg viewBox="0 0 600 320" className="w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tScrollParch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FBF3DD" />
            <stop offset="1" stopColor="#EBDBB4" />
          </linearGradient>
          <linearGradient id="tScrollWood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6E4A24" />
            <stop offset="0.5" stopColor="#9A6B38" />
            <stop offset="1" stopColor="#5E3D1C" />
          </linearGradient>
          <linearGradient id="tScrollGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#B58A2C" />
            <stop offset="0.5" stopColor="#F2DE9E" />
            <stop offset="1" stopColor="#8F6B1B" />
          </linearGradient>
          <radialGradient id="tScrollGlow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="#D4AF37" stopOpacity="0.22" />
            <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="300" cy="292" rx="230" ry="16" fill="#000" opacity="0.12" />
        <rect x="60" y="40" width="480" height="240" fill="url(#tScrollGlow)" />

        {/* יריעת הקלף — נחשפת בין הגלילים */}
        <motion.g
          animate={{ scaleX: open ? 1 : 0.02 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: '300px 160px' }}
        >
          <rect x="150" y="70" width="300" height="180" rx="4" fill="url(#tScrollParch)" />
          <rect x="150" y="70" width="300" height="180" rx="4" fill="none" stroke="#D8C79A" strokeWidth="1.5" />
          {/* צל גלילה בקצוות */}
          <rect x="150" y="70" width="20" height="180" fill="#00000018" />
          <rect x="430" y="70" width="20" height="180" fill="#00000018" />
          {open && (
            <>
              <ScrollColumn x={182} delay={0.5} />
              <ScrollColumn x={272} delay={0.66} />
              <ScrollColumn x={362} delay={0.82} />
            </>
          )}
        </motion.g>

        {/* עץ חיים ימני */}
        <motion.g animate={{ x: rollerGap }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
          <rect x="292" y="30" width="16" height="260" rx="8" fill="url(#tScrollWood)" />
          <ellipse cx="300" cy="30" rx="26" ry="15" fill="url(#tScrollGold)" />
          <ellipse cx="300" cy="290" rx="26" ry="15" fill="url(#tScrollGold)" />
          <ellipse cx="300" cy="30" rx="14" ry="8" fill="#8F6B1B" opacity="0.5" />
          <ellipse cx="300" cy="290" rx="14" ry="8" fill="#8F6B1B" opacity="0.5" />
          {/* קלף מגולגל על העמוד */}
          <rect x="286" y="66" width="28" height="188" rx="12" fill="url(#tScrollParch)" stroke="#D8C79A" strokeWidth="1" />
        </motion.g>

        {/* עץ חיים שמאלי */}
        <motion.g animate={{ x: -rollerGap }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
          <rect x="292" y="30" width="16" height="260" rx="8" fill="url(#tScrollWood)" />
          <ellipse cx="300" cy="30" rx="26" ry="15" fill="url(#tScrollGold)" />
          <ellipse cx="300" cy="290" rx="26" ry="15" fill="url(#tScrollGold)" />
          <ellipse cx="300" cy="30" rx="14" ry="8" fill="#8F6B1B" opacity="0.5" />
          <ellipse cx="300" cy="290" rx="14" ry="8" fill="#8F6B1B" opacity="0.5" />
          <rect x="286" y="66" width="28" height="188" rx="12" fill="url(#tScrollParch)" stroke="#D8C79A" strokeWidth="1" />
        </motion.g>
      </svg>
    </button>
  );
}
