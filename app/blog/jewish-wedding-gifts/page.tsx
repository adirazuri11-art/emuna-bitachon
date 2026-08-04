import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'מתנות לחתונה יהודית — 7 רעיונות מרגשים ומשמעותיים',
  description:
    'מה קונים לזוג יהודי שמתחתן? 7 מתנות משמעותיות לבית יהודי: פמוטי שבת, גביע קידוש, ברכת הבית ועוד — לכל תקציב. מדריך מתנות מלא.',
  keywords: ['מתנות לחתונה', 'מתנה לחתונה יהודית', 'מתנה לזוג', 'מתנה לחנוכת בית', 'מתנות יהודיות', 'הקמת בית יהודי'],
  alternates: { canonical: '/blog/jewish-wedding-gifts' },
};

export default function JewishWeddingGifts() {
  return (
    <article className="prose prose-lg mx-auto max-w-3xl px-4 py-16 prose-headings:font-display prose-headings:text-navy prose-p:text-navy/80 prose-strong:text-navy prose-a:text-gold">
      <p className="text-sm font-medium text-gold">רעיונות למתנה</p>
      <h1>מתנות לחתונה יהודית: 7 רעיונות משמעותיים</h1>

      <p>
        חתונה יהודית היא הקמת בית חדש — ומתנה טובה מלווה את הזוג לשנים. במקום עוד מגבת או כלי מטבח, הנה 7 <strong>מתנות לחתונה</strong> שמשלבות משמעות, יופי ושימוש יומיומי. לכל תקציב.
      </p>

      <h2>1. פמוטי שבת</h2>
      <p>
        המתנה הקלאסית להקמת בית — <Link href="/category/candlesticks">זוג פמוטי שבת</Link> שהכלה תדליק בכל ערב שבת. עם חריטת שם הזוג ותאריך עברי, זו מתנה שנשמרת דורות. (מדריך:{' '}
        <Link href="/blog/shabbat-candlesticks-guide">איך בוחרים פמוטי שבת</Link>.)
      </p>

      <h2>2. גביע קידוש</h2>
      <p>
        <Link href="/category/kiddush-cups">גביע קידוש מכסף</Link> לשולחן השבת של הזוג הצעיר. בחירה מכובדת ואישית. (מדריך:{' '}
        <Link href="/blog/kiddush-cup-guide">בחירת גביע קידוש</Link>.)
      </p>

      <h2>3. ברכת הבית מעוצבת</h2>
      <p>
        <Link href="/category/blessings">ברכת הבית</Link> לכניסה לבית החדש — מתנה חמה ומרגשת. סגנון הבטון המודרני פופולרי במיוחד אצל זוגות צעירים. (מדריך:{' '}
        <Link href="/blog/home-blessing-guide">ברכת הבית מבטון</Link>.)
      </p>

      <h2>4. מזוזה מעוצבת</h2>
      <p>
        לכל פתח בבית החדש — <Link href="/category/mezuzot">מזוזה מהודרת</Link> בעיצוב שתואם לסגנון הזוג. אפשר סט של כמה מזוזות לחדרים.
      </p>

      <h2>5. סט הבדלה</h2>
      <p>
        מתנה מקורית פחות שגורה: <Link href="/category/havdalah">סט הבדלה</Link> יפה למוצאי שבת — שמשלים את השבת של הזוג מקבלה ועד הבדלה.
      </p>

      <h2>6. כיסוי חלה</h2>
      <p>
        נגיעה עדינה לשולחן השבת: <Link href="/category/challah-covers">כיסוי חלה מעוצב</Link>, לבד או כחלק מסט שולחן שבת שלם.
      </p>

      <h2>7. שובר מתנה — כשלא בטוחים</h2>
      <p>
        אם קשה לבחור, <Link href="/gift-card">שובר מתנה</Link> נותן לזוג לבחור בעצמו. תמיד מתאים.
      </p>

      <h2>טיפ אחרון</h2>
      <p>
        כל מתנה נראית מושקעת יותר עם <Link href="/checkout">אריזת מתנה וכרטיס ברכה אישי</Link>. ואם אתם מתלבטים — נסו את{' '}
        <Link href="/gift-finder">מאתר המתנה המושלמת</Link> שימצא לכם התאמה לפי התקציב והאירוע.
      </p>
    </article>
  );
}
