'use client';

// ============================================================
// Consent Banner — GA4 & Cookies
// משתמש ב-localStorage כדי לשמור בחירות המשתמש
// GA4 יטעון רק אחרי הסכמה
// ============================================================

import { useEffect, useState } from 'react';
import Script from 'next/script';

const CONSENT_KEY = 'ga4-consent';

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // בדוק אם יש כבר הסכמה
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === null) {
      setIsVisible(true);
      setHasConsent(null);
    } else {
      setHasConsent(stored === 'true');
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setHasConsent(true);
    setIsVisible(false);
    // טען GA4
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    setHasConsent(false);
    setIsVisible(false);
  };

  return (
    <>
      {/* GA4 — טען רק אחרי הסכמה */}
      {hasConsent === true && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-DR0HECKLTH"
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-DR0HECKLTH', { 'anonymize_ip': true });
            `}
          </Script>
        </>
      )}

      {/* Consent Banner */}
      {isVisible && (
        <div
          dir="rtl"
          className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-sm">
              אנו משתמשים ב-Google Analytics כדי להבין איך אתם משתמשים באתר שלנו.
              {' '}
              <a
                href="/cookies"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                למידע נוסף על Cookies
              </a>
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
              >
                דחיית
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded text-sm font-medium"
              >
                אני מסכים
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
