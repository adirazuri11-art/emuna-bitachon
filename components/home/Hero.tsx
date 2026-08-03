'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface HeroProps {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero({ badge, title, highlight, subtitle, primaryCta }: HeroProps) {
  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden bg-navy-deep">
      {/* שכבות רקע — זוהר זהב עדין */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 start-1/4 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-0 end-10 h-[360px] w-[360px] rounded-full bg-gold-soft/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,#0B132B_100%)]" />
        {/* עיטורים צפים */}
        <motion.div
          className="absolute end-[12%] top-[18%] hidden h-24 w-24 rounded-full border border-gold/20 lg:block"
          animate={{ y: [-10, 10, -10], rotate: [0, 8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[20%] start-[10%] hidden h-14 w-14 rotate-45 border border-gold/15 lg:block"
          animate={{ y: [8, -8, 8] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-4xl px-4 py-20 text-center"
      >
        <motion.div
          variants={item}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold"
        >
          <Star className="h-3.5 w-3.5 fill-gold" />
          {badge}
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display text-5xl font-bold leading-[1.15] text-cream md:text-7xl"
        >
          {title}
          <br />
          <span className="gold-text">{highlight}</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/70"
        >
          {subtitle}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/collections/holiday"
            className="group relative overflow-hidden rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-3.5 font-bold text-navy shadow-gold transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            {primaryCta}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
