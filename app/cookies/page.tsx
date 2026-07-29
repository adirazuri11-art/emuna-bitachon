import Link from 'next/link';
import { COOKIE_POLICY } from '@/lib/legal-content';

export const metadata = {
  title: 'מדיניות Cookies | אמונה וביטחון',
  description: 'כיצב אנחנו משתמשים ב-Cookies וכיצב לנהל אותם',
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white text-right" dir="rtl">
      {/* Header */}
      <div className="bg-amber-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{COOKIE_POLICY.title}</h1>
          <p className="text-sm text-amber-200">שלטו בנתוניכם · בחרו איזה cookies לקבל</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {COOKIE_POLICY.sections.map((section) => (
          <section key={section.id} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-black">{section.title}</h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </section>
        ))}

        {/* Cookie Manager Box */}
        <div className="mt-12 p-6 bg-amber-50 rounded-lg border-r-4 border-amber-900">
          <h3 className="font-bold text-black mb-3">🍪 מנהל ה-Cookies שלנו</h3>
          <p className="text-sm text-gray-700 mb-4">
            בתחתית כל דף תוכלו למצוא את כפתור "הגדרות Cookies" — לחצו כדי לנהל את כל העדפות ה-tracking שלכם.
          </p>
          <button className="px-6 py-2 bg-amber-900 text-white rounded font-bold hover:bg-amber-800">
            📋 פתח הגדרות Cookies
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600 mb-4">דפים משפטיים נוספים:</p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/terms" className="text-blue-600 hover:underline">
              תנאים וסוג
            </Link>
            <Link href="/privacy" className="text-blue-600 hover:underline">
              מדיניות הפרטיות
            </Link>
            <Link href="/returns" className="text-blue-600 hover:underline">
              מדיניות החזרות
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
