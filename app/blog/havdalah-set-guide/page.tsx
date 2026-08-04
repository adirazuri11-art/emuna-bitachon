import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'סט הבדלה — מדריך לבחירת כלי הבדלה למוצאי שבת',
  description:
    'סט הבדלה כולל: גביע, בשמים (הדס) ומעמד נר. מדריך בחירה — חומרים, סגנונות ומה חשוב, + רעיון למתנה יהודית מושלמת.',
  keywords: ['הבדלה', 'סט הבדלה', 'כלי הבדלה', 'בשמים הבדלה', 'נר הבדלה', 'מוצאי שבת', 'מתנה יהודית'],
  alternates: { canonical: '/blog/havdalah-set-guide' },
};

export default function HavdalahSetGuide() {
  return (
    <article className="prose prose-lg mx-auto max-w-3xl px-4 py-16 prose-headings:font-display prose-headings:text-navy prose-p:text-navy/80 prose-strong:text-navy prose-a:text-gold">
      <p className="text-sm font-medium text-gold">מדריכי קנייה</p>
      <h1>סט הבדלה: המדריך המלא לכלי מוצאי שבת</h1>

      <p>
        טקס ה<strong>הבדלה</strong> מלווה אותנו בפרידה מהשבת — רגע חושים של יין, ריח בשמים ואור נר. <strong>סט הבדלה</strong> יפה הופך את הרגע הזה למכובד ומרגש. הנה איך בוחרים{' '}
        <Link href="/category/havdalah">כלי הבדלה</Link> שילוו את המשפחה שנים.
      </p>

      <h2>מה כולל סט הבדלה?</h2>
      <ul>
        <li><strong>גביע</strong> — לכוס היין (רביעית, כמו בקידוש).</li>
        <li><strong>בשמים (הדס)</strong> — קופסת בשמים לברכת "בורא מיני בשמים".</li>
        <li><strong>מעמד נר</strong> — לנר הבדלה מרובה פתילות.</li>
      </ul>
      <p>יש סטים מלאים על מגש אחד, ויש כלים בודדים שאפשר לשלב לפי הטעם.</p>

      <h2>1. חומרים וסגנון</h2>
      <h3>כסף</h3>
      <p>הבחירה הקלאסית והמכובדת, מתאימה במיוחד למתנה. משדר מסורת ויוקרה.</p>
      <h3>מתכת מודרנית / נירוסטה</h3>
      <p>עיצוב נקי ועכשווי, עמיד וקל לתחזוקה — בחירה נהדרת לבית מודרני.</p>

      <h2>2. מגש תואם</h2>
      <p>
        מגש קטן מאחד את שלושת הכלים למראה מסודר וחגיגי, וגם קולט טיפות יין. סט מלא על מגש הוא מתנה שלמה ומרשימה.
      </p>

      <h2>3. מתנה יהודית מושלמת</h2>
      <p>
        סט הבדלה הוא מתנה מקורית ומרגשת — לחתונה, לחנוכת בית או לחג. שילוב יפה: סט הבדלה עם{' '}
        <Link href="/category/kiddush-cups">גביע קידוש</Link> תואם, לשולחן שבת שלם מקבלה ועד הבדלה. הוסיפו{' '}
        <Link href="/checkout">אריזת מתנה וכרטיס ברכה</Link>.
      </p>

      <h2>לסיכום</h2>
      <p>
        בחרו בין סט מלא לכלים בודדים, חומר לפי הסגנון (כסף למתנה, מתכת מודרנית ליומיום), ושקלו מגש תואם. עיינו ב
        <Link href="/category/havdalah">אוסף כלי ההבדלה שלנו</Link> — שבוע טוב ומבורך.
      </p>
    </article>
  );
}
