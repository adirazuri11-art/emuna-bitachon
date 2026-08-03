import Link from 'next/link';
import { RETURNS_POLICY } from '@/lib/legal-content';
import { CheckCircle, Info, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'מדיניות משלוחים, החלפות, החזרות וביטול עסקה | אמונה וביטחון',
  description:
    'מדיניות משלוחים, החלפות, החזרות וביטול עסקה — הוגנת, ברורה ובהתאם לחוק הגנת הצרכן בישראל.',
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white text-right" dir="rtl">
      {/* Header */}
      <div className="bg-green-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{RETURNS_POLICY.title}</h1>
          <p className="text-sm text-green-200">
            משלוח חינם מעל ₪399 · ביטול עסקה בהתאם לחוק הגנת הצרכן
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Prominent cancellation CTA */}
        <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-5">
          <div>
            <p className="font-bold text-black">רוצים לבטל, להחזיר או להחליף?</p>
            <p className="text-sm text-gray-600">מלאו טופס קצר ותקבלו מספר פנייה למעקב.</p>
          </div>
          <Link
            href="/cancel"
            className="inline-flex items-center gap-2 rounded-full bg-green-900 px-6 py-3 font-bold text-white transition-colors hover:bg-green-800"
          >
            בקשה לביטול, החזרה או החלפה <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {RETURNS_POLICY.sections.map((section) => (
          <section key={section.id} className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-black">{section.title}</h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </section>
        ))}

        {/* Quick Reference — accurate, non-blanket */}
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-green-50 rounded-lg border-r-4 border-green-900">
            <div className="flex gap-3 mb-3">
              <CheckCircle className="text-green-700 flex-shrink-0" />
              <h3 className="font-bold text-black">מטופל ללא עלות מצדכם</h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ מוצר פגום</li>
              <li>✓ מוצר שגוי או שאינו תואם להזמנה</li>
              <li>✓ פריט חסר או טעות בחריטה מצדנו</li>
              <li>✓ ללא דמי ביטול וללא דמי החזרה</li>
            </ul>
          </div>

          <div className="p-6 bg-amber-50 rounded-lg border-r-4 border-amber-500">
            <div className="flex gap-3 mb-3">
              <Info className="text-amber-600 flex-shrink-0" />
              <h3 className="font-bold text-black">בכפוף לתנאי החוק</h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• שינוי דעת: ביטול תוך 14 יום; עלות ההחזרה על הלקוח</li>
              <li>• ייתכנו דמי ביטול עד 5% או 100 ₪ — הנמוך מביניהם</li>
              <li>• מוצר בהתאמה אישית: אין ביטול עקב שינוי דעת</li>
              <li>• פגם במוצר מותאם אישית — מטופל ללא עלות</li>
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600 mb-4">דפים נוספים:</p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/cancel" className="text-green-800 font-medium hover:underline">
              ביטול עסקה
            </Link>
            <Link href="/terms" className="text-blue-600 hover:underline">
              תנאי שימוש
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
