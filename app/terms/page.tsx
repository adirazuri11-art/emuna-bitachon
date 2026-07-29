import Link from 'next/link';
import { TERMS_AND_CONDITIONS } from '@/lib/legal-content';

export const metadata = {
  title: 'תנאים וסוג | אמונה וביטחון',
  description: 'תנאים וסוג של השימוש באתר אמונה וביטחון',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-right" dir="rtl">
      {/* Header */}
      <div className="bg-black text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{TERMS_AND_CONDITIONS.title}</h1>
          <p className="text-sm text-gray-300">עדכון אחרון: 30 ביולי 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {TERMS_AND_CONDITIONS.sections.map((section) => (
          <section key={section.id} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-black">{section.title}</h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </section>
        ))}

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600 mb-4">דפים משפטיים נוספים:</p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/privacy" className="text-blue-600 hover:underline">
              מדיניות הפרטיות
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
