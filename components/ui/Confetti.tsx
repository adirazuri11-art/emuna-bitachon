'use client';

// פרץ קונפטי עדין לרגעי שיא (סיום הזמנה). ללא תלות חיצונית.
// מכבד prefers-reduced-motion — לא מוצג כלל במצב מופחת.

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const COLORS = ['#D4AF37', '#F2DE9E', '#C5A059', '#1B2A5E', '#8E2434', '#2C6E8E'];

export function Confetti({ pieces = 44 }: { pieces?: number }) {
  const reduce = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.8 + Math.random() * 1.4,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 80,
      })),
    [pieces]
  );

  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ y: '-10vh', x: `${b.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', x: `calc(${b.x}vw + ${b.drift}px)`, rotate: b.rotate + 360, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: b.duration, delay: b.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: b.size,
            height: b.size * 0.6,
            backgroundColor: b.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
