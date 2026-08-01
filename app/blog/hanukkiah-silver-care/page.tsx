import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'טיפול בחנוכיית כסף — מדריך טיפול לשנים',
  description: 'שמירה על ברק החנוכיה, בדיקת כשרות, הדלקה בטוחה, ואחסון נכון.',
};

export default function HanukkiahCarePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-navy mb-4">איך לטפל בחנוכיית כסף</h1>

      <p className="text-navy/70 mb-6">
        חנוכיית כסף 925 היא יצירה יקרה. טיפול נכון שומר עליה לדורות.
      </p>

      <h2 className="text-2xl font-bold text-navy mt-8 mb-4">1. ניקוי בטוח</h2>
      <p className="mb-4">
        שתמש במטלית כסף ייעודית בלבד. מנקי כסף חזקים יכולים לשרוט את הקנים העדינים.
      </p>

      <h2 className="text-2xl font-bold text-navy mt-8 mb-4">2. הדלקת נרות</h2>
      <p className="mb-4">
        בחר נרות שעווה טהורה שלא מטפטפים. הנח חנוכיה על מגש מתכתי או קרמי.
      </p>

      <h2 className="text-2xl font-bold text-navy mt-8 mb-4">3. אחסון</h2>
      <p className="mb-4">
        אחסן בבד נטול חומצה, במקום יבש ואפל. זה שומר את הברק לשנים.
      </p>

      <h2 className="text-2xl font-bold text-navy mt-8 mb-4">4. בדיקה שנתית</h2>
      <p className="mb-8">
        בדוק את הקנים לסדקים. אם תראה סדק עמוק, פנה לאומן כסף.
      </p>

      <Link href="/category/home-judaica" className="text-gold font-bold hover:underline">
        ← חזור לחנוכיות שלנו
      </Link>
    </div>
  );
}
