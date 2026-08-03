'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ALL_POSTS } from '@/lib/all-50-posts';

/**
 * בנק התוכן של אמונה וביטחון
 * דף ניהול פנימי: 50 פוסטים מוכנים לפרסום בפייסבוק ובאינסטגרם
 */

interface ContentPost {
  id: number;
  productName: string;
  productUrl: string;
  category: string;
  price?: string | null;
  ig: string;
  fb: string;
  tags: string[];
  cta: string;
  family: number;
  published: boolean;
  timing: string;
}

// ============ 50 פוסטים בפועל ============
const CONTENT_POSTS = ALL_POSTS as unknown as ContentPost[];

const LEGACY_POSTS: ContentPost[] = [
  // FAMILY 1: MINIMALIST LUXURY
  { id: 1, productName: 'גביע קידוש "ירושלים"', productUrl: '/product/kiddush-cup-jerusalem-925', category: 'כוסות קידוש', price: '₪1,890', ig: 'גביע קידוש מכסף טהור עם עיטור זהב.\nלא רק כוס — זה בחירה בערכים.\n\n#אמונהוביטחון #כסף925 #כוסקידוש #שבתשלום', fb: 'כוס קידוש — לא רק כלי. גביע קידוש "ירושלים" מכסף סטרלינג 925 בעבודת יד, עם חגורת עיטור זהב בהשראת חומות העיר העתיקה.', tags: ['#אמונהוביטחון', '#כסף925', '#כוסקידוש', '#מתנה'], cta: 'לצפייה בפריט', family: 1, published: false, timing: 'יום שישי בערב' },
  { id: 2, productName: 'פמוטי שבת "הדר"', productUrl: '/product/candlesticks-modern-silver', category: 'פמוטים', price: '₪2,400', ig: 'פמוטי כסף בקו מודרני נקי.\nקו אנכי שלם, בסיס יציב, גימור מוברש בידיים.\n\nעיצוב שמדבר בשקט.\n\n#אמונהוביטחון #כסף925 #עיצובמודרני', fb: 'פמוטים — המקום שבו אור הופך לקדוש. קו מתעגל נקי בגימור כסף מוברש. זוג פמוטים מגיע במארז בד מרופד.', tags: ['#אמונהוביטחון', '#שבת', '#מתנהלכלה'], cta: 'לכל הפרטים באתר', family: 1, published: false, timing: 'יום שלישי-חמישי' },
  { id: 3, productName: 'סט חלה מפואר', productUrl: '/product/challah-set-silver-board', category: 'תשמישי קדושה לבית', price: '₪450', ig: 'סט חלה שלם: מגש עץ, סכין זהב וכיסוי רקום.\n\nאפילו לא צריך לחשוב — כל דבר בעלאו כבר בעלאו.\n\n#שולחן_שבת #הנפקה #אמונהוביטחון', fb: 'שולחן שבת מוכן — לא צריך להיות דרמה. סט חלה כולל מגש עץ אלון, סכין חלה וכיסוי רקום תואם.', tags: ['#שולחן_שבת', '#הנפקה', '#סט_מתנה'], cta: 'לצפייה בהקולקציה', family: 1, published: false, timing: 'יום חמישי' },
  { id: 4, productName: 'נטלה מהודרת', productUrl: '/product/natla-silver-engraved', category: 'תשמישי קדושה לבית', price: '₪520', ig: 'נטלה לא צריכה להיות פשוטה.\n\nבציפוי כסף עמיד, חגורה זהב, משקל נעים ביד.\n\n#נטילת_ידיים #בוקר #אמונהוביטחון', fb: 'משהו מוזר קרה כשקנו נטלה מהודרת: בוקר נעשה שונה. נטלה בציפוי כסף עמיד עם גוף מחוטב וידיות רחבות.', tags: ['#נטילה', '#בוקר', '#יהודאות'], cta: 'חנוכת בית שלכם', family: 1, published: false, timing: 'יום ראשון בוקר' },

  // FAMILY 2: WARM EMOTIONAL
  { id: 5, productName: 'גביע קידוש "ירושלים"', productUrl: '/product/kiddush-cup-jerusalem-925', category: 'כוסות קידוש', price: null, ig: 'ראיתי בשבת האחרונה כוס קידוש שמלווה משפחה למעל 30 שנה.\n\nאותו כסף. אותו קול. שלוש דורות.\n\nבבית שלך — מה אתה בוחר שישום?\n\n#אמונהוביטחון #מסורה #שבת', fb: 'משפחה אחת, כוס קידוש אחת, שלוש דורות. כשבן שלך בן 50 יחזיק בגביע קידוש של אבא שלו, יהיה לו יותר מאשר משהו לשרוק בתוכו.', tags: ['#אמונהוביטחון', '#דורלדור', '#שבת'], cta: 'שמרו את הפוסט למתנה', family: 2, published: false, timing: 'יום חמישי' },
  { id: 6, productName: 'מטפחת משי "פנינה"', productUrl: '/product/silk-headscarf-designed', category: 'מטפחות מעוצבות', price: '₪280', ig: 'מטפחת משי 100% שנושמת על העור.\n\nכל בוקר, 30 שניות, ואתם מוכנה למה שהיום מביא.\n\n#משי #כיסוי_ראש #אמונהוביטחון', fb: 'משי טבעי 100%, קל בראש, מחזיק קשירה, מרגיש כמו מטע על העור. לנשים שיודעות שדרוש להן זה טוב.', tags: ['#משי_טבעי', '#כיסוי_ראש', '#אמונהוביטחון'], cta: 'מגלים את הקולקציה', family: 2, published: false, timing: 'יום שלישי' },
  { id: 7, productName: 'כיסוי חלה סאטן', productUrl: '/product/challah-cover-satin-vine', category: 'תשמישי קדושה לבית', price: '₪180', ig: 'כיסוי חלה — סאטן משובח עם רקמת גפן וחיטה בזהב.\n\n2 שיבולים, 1 צמר שלם.\n\nפרטים שנעים לעין בשבת.\n\n#שולחן_שבת #רקמה #אמונהוביטחון', fb: 'כיסוי חלה הוא הדבר שאנשים לא שמים לב אליו — עד שהוא שם. כשמכסים את החלה בסאטן שמנת עם גפן וחיטה רקומים בזהב.', tags: ['#שולחן_שבת', '#רקמה', '#מתנה'], cta: 'ראו את הפרטים', family: 2, published: false, timing: 'יום חמישי' },
  { id: 8, productName: 'מזוזה מהודרת', productUrl: '/product/mezuzah-klaf-beit-yosef-12', category: 'תשמישי קדושה לבית', price: '₪680', ig: 'מזוזה בית יוסף + בית מעוצב.\n\nלא רק כשרות — גם אסתטיקה.\n\n#מזוזה #חנוכת_בית #אמונהוביטחון', fb: 'מזוזה מהודרת בכתב בית יוסף, נבדקת פעמיים, עם בית מתכת בגימור זהב. לחנוכת בית או לעדכון הבית הקיים.', tags: ['#מזוזה', '#חנוכת_בית', '#כשרות'], cta: 'הזמינו הבר', family: 2, published: false, timing: 'יום רביעי' },

  // FAMILY 3: GIFT IDEAS
  { id: 9, productName: 'טלית צמר "בית יוסף"', productUrl: '/product/tallit-beit-yosef-sefard', category: 'ציציות וטליתות', price: '₪1,150', ig: 'מה קנית לבן שלך לבר מצווה?\n\nטלית לא זה פשוט מוצר. זה הרגל שמתחילה בן 13 וממשיכה עד 80.\n\nבחרו טלית שהיא שלו.\n\n#בר_מצווה #טלית #אמונהוביטחון', fb: 'בן שלך בן 13 — איזו טלית אתם בוחרים? טלית בנויה לעמור שנים. 100% צמר משובח, קשירה ספרדית בדיוק כמו בקטגוריה.', tags: ['#בר_מצווה', '#טלית', '#מתנה'], cta: 'קראו על הטלית', family: 3, published: false, timing: 'יום ראשון-שלישי' },
  { id: 10, productName: 'תיק טלית קטיפה', productUrl: '/product/tallit-bag-velvet-embroidery', category: 'מתנות ואירועים', price: '₪320', ig: 'טלית + תיק תואם = מתנה שלמה.\n\nקטיפה כחולה עמוקה עם רקמת זהב.\n\n#בר_מצווה #סט_מתנה #אמונהוביטחון', fb: 'כל טלית צריכה בית שלה. תיק קטיפה עם ריפוד פנימי, רוכסן איכותי ורקמת שם בחוט מטאלי.', tags: ['#בר_מצווה', '#טלית', '#תיק_מעוצב'], cta: 'ראו את הסט השלם', family: 3, published: false, timing: 'יום חמישי' },
  { id: 11, productName: 'סידור עור איטלקי', productUrl: '/product/siddur-leather-custom-emboss', category: 'מתנות ואירועים', price: '₪240', ig: 'סידור עור עם השם שלו בזהב.\n\nזה יום ראשון של בר מצווה.\nזה לא יום אחרון.\n\n#בר_מצווה #סידור #אמונהוביטחון', fb: 'בר מצווה לא הוא יום — זה תחילת משהו. כל בוקר כשבן שלך יפתח את הסידור עם השם שלו בזהב על הכריכה.', tags: ['#בר_מצווה', '#סידור', '#מתנה'], cta: 'בחרו סידור', family: 3, published: false, timing: 'יום שני' },
  { id: 12, productName: 'תפילין מהודרות', productUrl: '/product/tefillin-beit-yosef-mehudarot', category: 'מתנות ואירועים', price: '₪2,850', ig: 'תפילין בתבחור "גסות" — בתים מעור אחד, פרשיות כתב בית יוסף.\n\nבד"ץ, תעודת בדיקה, ליווי סופר.\n\nהוא יחבוש אותן כל יום של חיים.\n\n#בר_מצווה #תפילין #סת"ם', fb: 'תפילין הם הדבר האחד שגבר יהודי חובש כל יום של חייו. תפילין "גסות" בעור בהמה עם בדיקה כפולה.', tags: ['#תפילין', '#בר_מצווה', '#סת"ם'], cta: 'קיבלנו הזמנה', family: 3, published: false, timing: 'יום ראשון בוקר' },

  // FAMILY 4: ENGAGEMENT
  { id: 13, productName: 'מזוזה מהודרת', productUrl: '/product/mezuzah-klaf-beit-yosef-12', category: 'תשמישי קדושה לבית', price: null, ig: 'בבוחרים במזוזה — בעיקר בדקו או בעיצוב הבית?\n\nתגידו בתגובות.\n\n#אמונהוביטחון #מזוזה #חנוכת_בית', fb: 'סוד לא נשמור: למרות שמזוזה זה סת"ם, מרבית המשפחות בוחרות קודם לכל בעיצוב הבית. ובחוקיות — גם שניהם חשובים.', tags: ['#מזוזה', '#חנוכת_בית', '#אמונהוביטחון'], cta: 'ספרו לנו בתגובות', family: 4, published: false, timing: 'יום רביעי' },

  // FAMILY 5-10: REMAINING POSTS
  { id: 14, productName: 'חנוכיית כסף 925', productUrl: '/product/hanukkiah-silver-925-mikdash', category: 'תשמישי קדושה לבית', price: '₪3,200', ig: 'חנוכיית כסף "בית המקדש" — 9 קנים מתעגלים וקול שנכנס ללב.\n\nאיכותית כמו טלית, עתיקה כמו זכרון.\n\n#חנוכה #כסף_925 #אמונהוביטחון', fb: 'כשמדליקים את החנוכיה בחנוכה — זה לא סתם טקס. זה הודעה למשפחה שקורה משהו חשוב. חנוכיית כסף בעבודת אומן.', tags: ['#חנוכה', '#כסף_925', '#עבודת_אומן'], cta: 'הרזרבו את שלכם', family: 7, published: false, timing: 'אלול/תשרי' },
  { id: 15, productName: 'סט הבדלה מכסף', productUrl: '/product/havdalah-set-silver', category: 'תשמישי קדושה לבית', price: '₪1,450', ig: 'סט הבדלה שלם על מגש כסף.\n\nגביע, מגדל בשמים מעוטר, מעמד לנר.\n\nרגע חמש דקות שהופך את השבוע לחדש.\n\n#הבדלה #כסף_925 #שבת', fb: 'סט הבדלה הוא הסיפור הקטן שנראה גדול כשמדליקים אותו. גביע יין, ריחות של בשמים ונר שמתלקח.', tags: ['#הבדלה', '#שבת', '#כסף_925'], cta: 'לצפייה בפריט', family: 8, published: false, timing: 'יום חמישי בצהריים' },
  // ... (posts 16-50 continue with similar structure)
];

// ============ פילטרים ============

type FilterCat = 'all' | string;
type SortBy = 'number' | 'category' | 'family';

export default function ContentBankPage() {
  const [filterCategory, setFilterCategory] = useState<FilterCat>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPublished, setShowOnlyPublished] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('number');
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  // ============ סינון ============

  const categories = Array.from(new Set(CONTENT_POSTS.map((p) => p.category)));
  const designFamilies = Array.from(new Set(CONTENT_POSTS.map((p) => p.family)));

  const filteredPosts = useMemo(() => {
    let result = [...CONTENT_POSTS];

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter((p) => p.category === filterCategory);
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.productName.includes(searchTerm) ||
          p.category.includes(searchTerm) ||
          p.ig.includes(searchTerm)
      );
    }

    // Filter by published status
    if (showOnlyPublished) {
      result = result.filter((p) => p.published);
    }

    // Sort
    if (sortBy === 'category') {
      result.sort((a, b) => a.category.localeCompare(b.category, 'he'));
    } else if (sortBy === 'family') {
      result.sort((a, b) => a.family - b.family);
    }

    return result;
  }, [filterCategory, searchTerm, showOnlyPublished, sortBy]);

  const publishedCount = CONTENT_POSTS.filter((p) => p.published).length;
  const progress = Math.round((publishedCount / CONTENT_POSTS.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-black text-white mb-2">בנק התוכן של אמונה וביטחון</h1>
        <p className="text-xl text-gray-400">50 פוסטים מוכנים לפרסום בפייסבוק ובאינסטגרם</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-300">
            פורסמו {publishedCount} מתוך {CONTENT_POSTS.length} פוסטים
          </span>
          <span className="text-lg font-bold text-amber-400">{progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Search */}
        <input
          type="text"
          placeholder="חיפוש..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-amber-500 outline-none"
        />

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as FilterCat)}
          className="bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-amber-500 outline-none"
        >
          <option value="all">כל הקטגוריות</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Published Filter */}
        <label className="flex items-center gap-2 bg-slate-800 px-4 py-3 rounded-lg border border-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyPublished}
            onChange={(e) => setShowOnlyPublished(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500"
          />
          <span className="text-white text-sm">פורסמו בלבד</span>
        </label>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-amber-500 outline-none"
        >
          <option value="number">לפי מספר</option>
          <option value="category">לפי קטגוריה</option>
          <option value="family">לפי עיצוב</option>
        </select>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-amber-500 transition-all"
          >
            {/* Post Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-700">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">#{post.id.toString().padStart(2, '0')}</h3>
                  <p className="text-lg font-semibold text-amber-400 mt-1">{post.productName}</p>
                  <p className="text-sm text-gray-400 mt-1">{post.category}</p>
                  {post.price && <p className="text-sm text-amber-300 font-semibold mt-2">{post.price}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      post.published
                        ? 'bg-green-500 bg-opacity-20 text-green-300'
                        : 'bg-gray-500 bg-opacity-20 text-gray-300'
                    }`}
                  >
                    {post.published ? '✓ פורסם' : 'טרם פורסם'}
                  </span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-6 py-4">
              {/* Instagram Caption Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">📱 אינסטגרם</h4>
                <p className="text-sm text-gray-400 line-clamp-3 whitespace-pre-wrap">
                  {post.ig}
                </p>
              </div>

              {/* Timing & Design Family */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="bg-slate-700 rounded px-3 py-2">
                  <p className="text-gray-400">📅 זמן הפרסום</p>
                  <p className="text-white font-semibold mt-1">{post.timing}</p>
                </div>
                <div className="bg-slate-700 rounded px-3 py-2">
                  <p className="text-gray-400">🎨 משפחת עיצוב</p>
                  <p className="text-white font-semibold mt-1">Family {post.family}</p>
                </div>
              </div>

              {/* Hashtags */}
              <div className="mb-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs text-amber-400 bg-slate-700 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm font-semibold transition">
                  📥 הורד תמונה
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition">
                  📋 העתק אינסטגרם
                </button>
                <button className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded text-sm font-semibold transition">
                  📘 העתק פייסבוק
                </button>
              </div>

              {/* More Details */}
              <button
                onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                className="w-full mt-3 text-sm text-amber-400 hover:text-amber-300 font-semibold"
              >
                {expandedPostId === post.id ? '⬆️ הסתר פרטים' : '⬇️ פרטים נוספים'}
              </button>

              {/* Expanded Content */}
              {expandedPostId === post.id && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-300 mb-2">📘 פייסבוק</h5>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{post.fb}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={post.productUrl}
                      target="_blank"
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-semibold transition text-center"
                    >
                      🔗 מוצר באתר
                    </Link>
                    <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-semibold transition">
                      ✏️ הוסף הערה
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-400 text-sm">
        <p>בנק התוכן של אמונה וביטחון • {filteredPosts.length} פוסטים בתצוגה</p>
        <p className="mt-2 text-gray-600">עמוד זה מוגן ולא מופיע בנווט הציבורי</p>
      </div>
    </div>
  );
}
