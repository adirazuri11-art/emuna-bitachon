import Link from 'next/link';
import { PRIVACY_POLICY } from '@/lib/legal-content';

export const metadata = {
  title: 'מדיניות הפרטיות | אמונה וביטחון',
  description: 'מדיניות הגנת הפרטיות של אמונה וביטחון',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-right" dir="rtl">
      {/* Header */}
      <div className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{PRIVACY_POLICY.title}</h1>
          <p className="text-sm text-blue-200">עדכון אחרון: {PRIVACY_POLICY.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {PRIVACY_POLICY.sections.map((section) => (
          <section key={section.id} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-black">{section.title}</h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </section>
        ))}

        {/* DPA Notice */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border-r-4 border-blue-900">
          <h3 className="font-bold text-black mb-2">הגנת נתונים בינלאומית</h3>
          <p className="text-sm text-gray-700">
            אנחנו מחויבים לתנאים של GDPR (אירופה) ודיני הגנה על נתונים בינלאומיים אחרים.
            אם אתם באירופה, יש לכם זכויות נוספות תחת GDPR.
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600 mb-4">דפים משפטיים נוספים:</p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/terms" className="text-blue-600 hover:underline">
              תנאים וסוג
            </Link>
            <Link href="/returns" className="text-blue-600 hover:underline">
              מדיניות החזרות
            </Link>
            <Link href="/cookies" className="text-blue-600 hover:underline">
              מדיניות Cookies
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
