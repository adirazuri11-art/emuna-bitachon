// STATIC_EXPORT=1 → בילד סטטי ל-Surge (בלי API routes / ISR).
// בלי הדגל → מצב שרת מלא (פיתוח מקומי / Vercel).
const isStaticExport = process.env.STATIC_EXPORT === '1';

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
    };

export default nextConfig;
