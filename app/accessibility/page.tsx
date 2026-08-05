import type { Metadata } from 'next';
import { Accessibility, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'הצהרת נגישות',
  description:
    'הצהרת הנגישות של אתר אמונה וביטחון — מחויבות לנגישות דיגיטלית לפי תקן ישראלי 5568 (WCAG 2.0 AA).',
  alternates: { canonical: '/accessibility' },
};

const FEATURES = [
  'התאמת גודל הטקסט (הגדלה עד 150%) דרך תפריט הנגישות',
  'מצב ניגודיות גבוהה לשיפור הקריאוּת',
  'הדגשת קישורים וקו תחתון להבחנה ברורה',
  'החלפה לגופן קריא',
  'עצירת אנימציות ותנועה (כולל כיבוד prefers-reduced-motion של הדפדפן)',
  'ניווט מלא באמצעות מקלדת (Tab / Shift+Tab / Enter) עם סימון פוקוס ברור',
  'תיאורי alt בעברית לתמונות המוצרים',
  'מבנה HTML סמנטי, כותרות היררכיות ותוויות לשדות טפסים',
  'תמיכה בקוראי מסך (aria-labels ותפקידי ARIA)',
];

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy">
          <Accessibility className="h-6 w-6 text-gold" />
        </span>
        <h1 className="font-display text-3xl font-bold text-navy">הצהרת נגישות</h1>
      </div>

      <div className="space-y-6 leading-relaxed text-navy/80">
        <p>
          חנות "אמונה וביטחון" רואה חשיבות רבה במתן שירות שוויוני לכלל הלקוחות, ופועלת להנגיש את
          האתר כך שיתאפשר שימוש נוח ועצמאי גם לאנשים עם מוגבלות. אנו משקיעים מאמצים לעמוד
          בהוראות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013,
          וברמת התקן הישראלי 5568 המבוסס על הנחיות <span dir="ltr">WCAG 2.0</span> ברמה AA.
        </p>

        <div>
          <h2 className="mb-3 font-display text-xl font-bold text-navy">אמצעי הנגישות באתר</h2>
          <ul className="space-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-navy/60">
            את תפריט הנגישות ניתן לפתוח בכל עמוד באמצעות כפתור הנגישות הצף (בפינה השמאלית התחתונה).
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-bold text-navy">החרגות ומגבלות</h2>
          <p>
            למרות מאמצינו להנגיש את כלל הדפים, ייתכן שחלקים מסוימים באתר טרם הונגשו במלואם או
            נמצאים בתהליך שיפור מתמשך. אנו ממשיכים לפעול לשיפור הנגישות כחלק ממחויבותנו לכלל הגולשים.
          </p>
        </div>

        <div className="rounded-2xl border border-gold/25 bg-white p-5 shadow-card">
          <h2 className="mb-2 font-display text-xl font-bold text-navy">פנייה בנושא נגישות</h2>
          <p className="text-sm">
            נתקלתם בבעיית נגישות, או שיש לכם הצעה לשיפור? נשמח לשמוע ולטפל בהקדם. ניתן לפנות אל
            רכז/ת הנגישות של העסק:
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>שם רכז/ת הנגישות: <span className="font-medium text-gold-soft">אדיר עזורי</span></li>
            <li>טלפון: <a href="tel:0503096969" className="font-medium text-gold-soft hover:underline" dir="ltr">050-309-6969</a></li>
            <li>דוא"ל: <a href="mailto:orders@emunavebitachon.co.il" className="font-medium text-gold-soft hover:underline" dir="ltr">orders@emunavebitachon.co.il</a></li>
          </ul>
          <p className="mt-3 text-xs text-navy/50">
            בפנייה נא לפרט את הבעיה, את הדף שבו היא התרחשה ואת סוג הדפדפן/המכשיר, כדי שנוכל לסייע במהירות.
          </p>
        </div>

        <p className="text-xs text-navy/40">
          עודכן לאחרונה: 5 באוגוסט 2026. אנו פועלים לשיפור מתמיד של נגישות האתר; הצהרה זו תעודכן בהתאם.
        </p>
      </div>
    </div>
  );
}
