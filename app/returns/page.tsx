import Link from 'next/link';
import { RETURNS_POLICY } from '@/lib/legal-content';
import { CheckCircle, XCircle } from 'lucide-react';

export const metadata = {
  title: 'מדיניות החזרות ומשלוח | אמונה וביטחון',
  description: 'כל מה שצריך לדעת על החזרות, משלוח והחלפות',
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white text-right" dir="rtl">
      {/* Header */}
      <div className="bg-green-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{RETURNS_POLICY.title}</h1>
          <p className="text-sm text-green-200">משלוח חינם בהזמנה מעל ₪399 · החזרה עד 30 יום</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {RETURNS_POLICY.sections.map((section) => (
          <section key={section.id} className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-black">{section.title}</h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </section>
        ))}

        {/* Quick Reference Box */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-green-50 rounded-lg border-r-4 border-green-900">
            <div className="flex gap-3 mb-3">
              <CheckCircle className="text-green-700 flex-shrink-0" />
              <h3 className="font-bold text-black">ניתנים להחזרה</h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ מוצרים רגילים</li>
              <li>✓ תוך 30 יום</li>
              <li>✓ בחדשים + packaging</li>
              <li>✓ ללא עדויות שימוש</li>
            </ul>
          </div>

          <div className="p-6 bg-red-50 rounded-lg border-r-4 border-red-900">
            <div className="flex gap-3 mb-3">
              <XCircle className="text-red-700 flex-shrink-0" />
              <h3 className="font-bold text-black">לא ניתנים להחזרה</h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>❌ התאמה אישית</li>
              <li>❌ ספרים (אלא אם פגום)</li>
              <li>❌ עם עדויות שימוש</li>
              <li>❌ ללא packaging</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 p-6 bg-gray-900 text-white rounded-lg text-center">
          <p className="mb-3">צריכים עזרה?</p>
          <a
            href="https://wa.me/972503096969?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%99%D7%A9%20%D7%9C%D7%99%20%D7%A9%D7%90%D7%9C%D7%95%D7%AA%20%D7%91%D7%9E%D7%93%D7%99%D7%A0%D7%99%D7%95%D7%AA%20%D7%97%D7%96%D7%A8%D7%95%D7%AA%F0%9F%99%8F"
            target="_blank"
            rel="noopener"
            className="inline-block bg-white text-gray-900 px-6 py-3 rounded font-bold hover:bg-gray-100"
          >
            🔗 דברו איתנו בוואטסאפ
          </a>
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
            <Link href="/cookies" className="text-blue-600 hover:underline">
              מדיניות Cookies
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
