// STATIC_EXPORT=1 → בילד סטטי ל-Surge (בלי API routes / ISR).
// בלי הדגל → מצב שרת מלא (פיתוח מקומי / Vercel).
const isStaticExport = process.env.STATIC_EXPORT === '1';

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
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://hdeoeycbpuxwtabuhawz.supabase.co",
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
    };

export default nextConfig;
/* Vercel rebuild trigger: 1785754085N */
