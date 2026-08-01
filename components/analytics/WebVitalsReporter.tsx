'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';

export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals((metric) => {
      // Send to Google Analytics if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', `web_vital_${metric.name.toLowerCase()}`, {
          value: metric.value,
          rating: metric.rating,
          metric_name: metric.name,
        });
      }

      // Log to console for debugging
      console.log(`[${metric.name}] ${metric.value} (${metric.rating})`);
    });
  }, []);

  return null;
}
