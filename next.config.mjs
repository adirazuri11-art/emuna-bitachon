// STATIC_EXPORT=1 → בילד סטטי ל-Surge (בלי API routes / ISR).
// בלי הדגל → מצב שרת מלא (פיתוח מקומי / Vercel).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const isStaticExport = process.env.STATIC_EXPORT === '1';

// 301/308 קבוע מ-slug של וריאנט-מידה שאוחד → מוצר ראשי (SEO). נוצר ב-prebuild
// (scripts/gen-variant-redirects.cjs) מ-VARIANT_TO_PARENT. חסר/ריק → [] (dev).
function variantRedirects() {
  try {
    const p = join(dirname(fileURLToPath(import.meta.url)), 'lib', 'variant-redirects.json');
    const arr = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ============================================================
// Security Headers — מוגנות מכל ההתקפות (CSP, clickjacking, etc.)
// ============================================================
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://hdeoeycbpuxwtabuhawz.supabase.co https://www.hebcal.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = isStaticExport
  ? {
      output: 'export',
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      images: {
        remotePatterns: [
          { protocol: 'https', hostname: '**.supabase.co' },
          { protocol: 'https', hostname: 'images.unsplash.com' },
          { protocol: 'https', hostname: '**.wolt.com' },
          { protocol: 'https', hostname: '**.cloudinary.com' },
          { protocol: 'https', hostname: 'www.israel-judaica.com' },
        ],
        formats: ['image/avif', 'image/webp'],
      },
      compress: true,
      poweredByHeader: false,
      productionBrowserSourceMaps: false,
      reactStrictMode: true,
      async headers() {
        return [
          {
            source: '/:path*',
            headers: securityHeaders,
          },
        ];
      },
      async redirects() {
        return variantRedirects();
      },
    };

export default nextConfig;
/* Vercel rebuild trigger: 1785754085N */
