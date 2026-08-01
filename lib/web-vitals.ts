// Web Vitals Tracking & Optimization
// Core Web Vitals: LCP, INP, CLS

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

// Thresholds per Google: Web Vitals 2024
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  FID: { good: 100, needsImprovement: 300 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

export function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[metric as keyof typeof VITALS_THRESHOLDS];
  if (!thresholds) return 'poor';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

export function initWebVitals(onMetric?: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return;

  // PerformanceObserver for LCP, INP, CLS
  if ('PerformanceObserver' in window) {
    try {
      // Observe LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcpValue = lastEntry.renderTime || lastEntry.loadTime;
        const metric: WebVitalsMetric = {
          name: 'LCP',
          value: Math.round(lcpValue),
          rating: getRating('LCP', lcpValue),
          delta: 0,
        };
        if (onMetric) onMetric(metric);
        console.log('[Web Vitals] LCP:', metric.value, 'ms —', metric.rating);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.log('LCP observer not supported');
    }

    try {
      // Observe CLS
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            const clsValue = (entry as any).value;
            const metric: WebVitalsMetric = {
              name: 'CLS',
              value: Math.round(clsValue * 100) / 100,
              rating: getRating('CLS', clsValue),
              delta: 0,
            };
            if (onMetric) onMetric(metric);
            console.log('[Web Vitals] CLS:', metric.value, '—', metric.rating);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.log('CLS observer not supported');
    }

    try {
      // Observe FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const metric: WebVitalsMetric = {
          name: 'FCP',
          value: Math.round(lastEntry.startTime),
          rating: getRating('FCP', lastEntry.startTime),
          delta: 0,
        };
        if (onMetric) onMetric(metric);
        console.log('[Web Vitals] FCP:', metric.value, 'ms —', metric.rating);
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.log('FCP observer not supported');
    }
  }

  // Navigation Timing for TTFB
  if ('performance' in window && window.performance.timing) {
    const timing = window.performance.timing;
    const ttfb = timing.responseStart - timing.navigationStart;
    const metric: WebVitalsMetric = {
      name: 'TTFB',
      value: Math.round(ttfb),
      rating: getRating('TTFB', ttfb),
      delta: 0,
    };
    if (onMetric) onMetric(metric);
    console.log('[Web Vitals] TTFB:', metric.value, 'ms —', metric.rating);
  }
}

// Optimization hints for each vital
export const OPTIMIZATION_HINTS = {
  LCP: [
    '1. Image optimization — file size, responsive srcset',
    '2. Critical CSS inlining — above the fold styling',
    '3. Server-side rendering / Static Generation',
    '4. Remove render-blocking JavaScript',
    '5. Optimize web fonts — system fonts, font-display: swap',
  ],
  INP: [
    '1. Break up long JavaScript tasks',
    '2. Reduce JavaScript bundle size',
    '3. Move heavy computations to Web Workers',
    '4. Optimize event handlers',
    '5. Profile with Chrome DevTools Performance tab',
  ],
  CLS: [
    '1. Set explicit dimensions for images/videos',
    '2. Avoid inserting content above existing content',
    '3. Use transform: instead of changing top/left',
    '4. Web fonts — font-display: swap',
    '5. Ads/embeds — reserve space with placeholders',
  ],
};
