import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'בלוג אמונה וביטחון — מדריכים יודאיקה',
  description: 'מדריכים מקצועיים בבחירת כלי קודש, טליתות, ומתנות יהודיות לאירועים.',
};

const BLOG_POSTS = [
  {
    slug: 'jewish-wedding-gifts',
    title: 'מתנות לחתונה יהודית — 7 רעיונות מרגשים ומשמעותיים',
    excerpt: 'פמוטי שבת, גביע קידוש, ברכת הבית ועוד — 7 מתנות משמעותיות לבית יהודי חדש, לכל תקציב.',
    category: 'מתנות ואירועים',
    date: '2026-08-04',
  },
  {
    slug: 'challah-cover-guide',
    title: 'כיסוי חלה מעוצב — מדריך לבחירת כיסוי לחלות שבת',
    excerpt: 'קטיפה, משי או רקמה? למה מכסים את החלות, גדלים, וחריטת שם. מדריך מלא + רעיון למתנה.',
    category: 'כיסויי חלה',
    date: '2026-08-04',
  },
  {
    slug: 'havdalah-set-guide',
    title: 'סט הבדלה — מדריך לבחירת כלי הבדלה למוצאי שבת',
    excerpt: 'גביע, בשמים ומעמד נר — מה כולל סט הבדלה, חומרים וסגנונות, ורעיון למתנה יהודית.',
    category: 'הבדלה',
    date: '2026-08-04',
  },
  {
    slug: 'netilat-yadayim-cup-guide',
    title: 'נטלה לנטילת ידיים — מדריך בחירת כלי נטילה',
    excerpt: 'שתי ידיות, חומרים (כסף/נירוסטה), נטלה למים אחרונים ועיצוב לשולחן. כל מה שצריך לדעת.',
    category: 'נטלות',
    date: '2026-08-04',
  },
  {
    slug: 'brit-newborn-gifts',
    title: 'מתנות לברית ולידה — רעיונות משמעותיים לתינוק החדש',
    excerpt: 'כרית ברית, ברכת לידה, מתנה ליולדת ועוד — מתנות מרגשות שנשמרות לכל החיים.',
    category: 'ברית ולידה',
    date: '2026-08-04',
  },
  {
    slug: 'kiddush-cup-guide',
    title: 'גביע קידוש מהודר — המדריך המלא לבחירת כוס קידוש',
    excerpt: 'כסף טהור מול מצופה, גודל לפי ההלכה (רביעית), עיצוב וחריטת שם — כל מה שצריך לפני שקונים.',
    category: 'כוסות קידוש',
    date: '2026-08-04',
  },
  {
    slug: 'mezuzah-design-guide',
    title: 'מזוזה מעוצבת לבית — איך בוחרים + מה ההלכה אומרת',
    excerpt: 'בית מזוזה מול קלף, מידות לפי הפתח, וחומרים: בטון, זכוכית ומתכת. המדריך שמסדר את הבלבול.',
    category: 'מזוזות',
    date: '2026-08-04',
  },
  {
    slug: 'home-blessing-guide',
    title: 'ברכת הבית מעוצבת מבטון — מדריך בחירה ומשמעות',
    excerpt: 'למה בטון, נוסח הברכה, איפה תולים, ורעיונות למתנה מושלמת לחנוכת בית.',
    category: 'ברכות',
    date: '2026-08-04',
  },
  {
    slug: 'custom-kippot-events',
    title: 'כיפות בהתאמה אישית לאירועים — בר מצווה, חתונה וברית',
    excerpt: 'סוגי כיפות, הדפסה מול רקמה, כמויות ומחירים, וכמה זמן מראש להזמין.',
    category: 'כיפות',
    date: '2026-08-04',
  },
  {
    slug: 'shabbat-candlesticks-guide',
    title: 'פמוטי שבת — מדריך לבחירת פמוטים לשולחן השבת',
    excerpt: 'כמה קנים, כסף מול נירוסטה, גובה ועיצוב, ולמה זו מתנה מושלמת לחתונה.',
    category: 'פמוטים',
    date: '2026-08-04',
  },
  {
    slug: 'choosing-tallit-guide',
    title: 'מדריך קנייה: איך בוחרים טלית?',
    excerpt: 'מה ההבדל בין נוסח אשכנז וספרד? איזה צמר טוב ביותר? הגיד סופר סת"ם בן 30 שנה.',
    category: 'טליתות',
    date: '2026-08-01',
  },
  {
    slug: 'bar-mitzvah-gifts-budget',
    title: 'מתנות לבר מצווה — הרעיון המושלם בכל תקציב',
    excerpt: 'עד ₪200, ₪500, או ₪1000? קילוואורדים שנבחרו על ידי 300+ הורים ודודות.',
    category: 'מתנות',
    date: '2026-08-01',
  },
  {
    slug: 'hanukkiah-silver-care',
    title: 'איך לטפל בחנוכיית כסף — גם שנים אחרי הקנייה',
    excerpt: 'טיפים מיוחדים לשמירה על הברק, בדיקה של כשרות, והדלקה בטוחה של נרות.',
    category: 'טיפול וטיפוח',
    date: '2026-07-30',
  },
];

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold text-navy">בלוג אמונה וביטחון</h1>
      <p className="mt-4 text-lg text-navy/70">
        מדריכים, טיפים והנושאים העמוקים שמאחורי כל כלי קודש ומתנה יהודית.
      </p>

      <div className="mt-12 grid gap-8">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="border-b border-gold/20 pb-8 last:border-0">
            <Link href={`/blog/${post.slug}`}>
              <span className="text-sm font-medium text-gold">{post.category}</span>
              <h2 className="mt-2 font-display text-2xl font-bold text-navy hover:text-gold transition-colors">
                {post.title}
              </h2>
            </Link>
            <p className="mt-2 text-navy/70">{post.excerpt}</p>
            <div className="mt-4 flex items-center justify-between">
              <time className="text-xs text-navy/50">{post.date}</time>
              <Link href={`/blog/${post.slug}`} className="text-sm font-bold text-gold hover:underline">
                קרא עוד →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
