import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'מתנות לברית ולידה — רעיונות משמעותיים לתינוק החדש',
  description:
    'מה קונים לברית מילה או ללידה? רעיונות למתנה מרגשת לתינוק ולמשפחה: כרית ברית, ברכת לידה, פמוט ראשון ועוד. מדריך מתנות מלא.',
  keywords: ['מתנות לברית', 'מתנה ללידה', 'מתנה לתינוק', 'ברית מילה', 'כרית ברית', 'ברכת לידה', 'מתנה ליולדת'],
  alternates: { canonical: '/blog/brit-newborn-gifts' },
};

export default function BritNewbornGifts() {
  return (
    <article className="prose prose-lg mx-auto max-w-3xl px-4 py-16 prose-headings:font-display prose-headings:text-navy prose-p:text-navy/80 prose-strong:text-navy prose-a:text-gold">
      <p className="text-sm font-medium text-gold">רעיונות למתנה</p>
      <h1>מתנות לברית ולידה: רעיונות משמעותיים</h1>

      <p>
        לידת תינוק וברית מילה הם רגעים מרגשים, ומתנה נכונה מלווה את המשפחה החדשה. במקום עוד בגד או צעצוע, הנה <strong>מתנות לברית וללידה</strong> שמשלבות רגש, מסורת ומזכרת שנשמרת לכל החיים. עיינו גם ב
        <Link href="/category/brit-newborn">קטגוריית ברית ולידה</Link>.
      </p>

      <h2>1. כרית ברית רקומה</h2>
      <p>
        <strong>כרית ברית</strong> מעוצבת עם שם התינוק ותאריך הברית — מזכרת קלאסית ומרגשת מהיום המיוחד, שנשמרת שנים ארוכות.
      </p>

      <h2>2. ברכת לידה ממוסגרת</h2>
      <p>
        ברכה מעוצבת עם שם התינוק לתלייה בחדר הילדים — מתנה חמה שמלווה את הילד בגדילה. משתלבת יפה בסגנון עיצובי רך ומודרני.
      </p>

      <h2>3. מתנה ליולדת</h2>
      <p>
        לא לשכוח את האמא! מארז מפנק ליולדת או תכשיט יהודי עדין הם מחווה חמה על הרגע הגדול. עיינו ב
        <Link href="/category/judaica-jewelry">תכשיטי יודאיקה</Link>.
      </p>

      <h2>4. סידור או תהילים אישי</h2>
      <p>
        <Link href="/category/books-siddurim">סידור או ספר תהילים</Link> עם הטבעת שם — מתנה מסורתית שמחברת את התינוק למורשת מהיום הראשון.
      </p>

      <h2>5. מזוזה לחדר התינוק</h2>
      <p>
        <Link href="/category/mezuzot">מזוזה מעוצבת</Link> לחדר הילד החדש — שמירה וברכה על הפתח, בעיצוב עדין שמתאים לחדר תינוק.
      </p>

      <h2>טיפ אחרון</h2>
      <p>
        מתנה לברית או ללידה נוגעת ללב עוד יותר עם <Link href="/checkout">כרטיס ברכה אישי</Link>. מתלבטים? <Link href="/gift-finder">מאתר המתנה</Link> ימצא לכם התאמה לפי התקציב.
      </p>
    </article>
  );
}
