import { Instagram, Facebook, Users, Image as ImageIcon, Heart, MessageCircle, ExternalLink, Zap } from 'lucide-react';
import { getSocialData } from '@/lib/crm/meta';

export const dynamic = 'force-dynamic';

const IG_URL = 'https://www.instagram.com/emunavebitachon';
const FB_URL = 'https://www.facebook.com/profile.php?id=61593009291594';

const nf = (n: number) => n.toLocaleString('he-IL');

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gold/15 bg-white/5 p-4 text-center">
      <div className="font-display text-2xl font-bold text-cream">{value}</div>
      <div className="mt-0.5 text-xs text-cream/50">{label}</div>
    </div>
  );
}

export default async function SocialPage() {
  const data = await getSocialData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">רשתות חברתיות</h1>
        <p className="mt-1 text-sm text-cream/50">
          {data.configured ? 'נתונים חיים מ-Meta Graph API' : 'מחובר לפרופילים · ממתין לחיבור נתונים חיים'}
        </p>
      </div>

      {/* Instagram */}
      <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/30 to-amber-500/30">
              <Instagram className="h-5 w-5 text-pink-300" />
            </span>
            <div>
              <div className="font-display font-bold text-cream">אינסטגרם</div>
              <a href={IG_URL} target="_blank" rel="noopener" className="text-xs text-cream/50 hover:text-gold" dir="ltr">
                @emunavebitachon
              </a>
            </div>
          </div>
          <a href={IG_URL} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-cream/60 hover:text-gold">
            פתיחה <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {data.instagram ? (
          <>
            <div className="mb-5 grid grid-cols-3 gap-3">
              <Stat label="עוקבים" value={nf(data.instagram.followers)} />
              <Stat label="פוסטים" value={nf(data.instagram.mediaCount)} />
              <Stat label="עוקב אחרי" value={nf(data.instagram.following)} />
            </div>
            {data.instagram.recentPosts.length > 0 && (
              <>
                <h3 className="mb-3 text-sm font-medium text-cream/60">פוסטים אחרונים</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.instagram.recentPosts.map((p) => (
                    <a key={p.id} href={p.permalink} target="_blank" rel="noopener" className="group overflow-hidden rounded-xl border border-white/10 bg-navy/40">
                      {p.mediaUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.mediaUrl} alt="" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-cream/20"><ImageIcon className="h-6 w-6" /></div>
                      )}
                      <div className="flex items-center gap-3 px-3 py-2 text-xs text-cream/60">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {nf(p.likeCount)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {nf(p.commentsCount)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <NotConnected />
        )}
      </div>

      {/* Facebook */}
      <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <Facebook className="h-5 w-5 text-blue-300" />
            </span>
            <div>
              <div className="font-display font-bold text-cream">פייסבוק</div>
              <a href={FB_URL} target="_blank" rel="noopener" className="text-xs text-cream/50 hover:text-gold">עמוד העסק</a>
            </div>
          </div>
          <a href={FB_URL} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-cream/60 hover:text-gold">
            פתיחה <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        {data.facebook ? (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="לייקים לעמוד" value={nf(data.facebook.fans)} />
            <Stat label="עוקבים" value={nf(data.facebook.followers)} />
            <Stat label="חשיפה (שבוע)" value={data.facebook.reachWeek != null ? nf(data.facebook.reachWeek) : '—'} />
          </div>
        ) : (
          <NotConnected />
        )}
      </div>
    </div>
  );
}

function NotConnected() {
  return (
    <div className="rounded-xl border border-gold/20 bg-navy/40 p-5 text-sm leading-relaxed text-cream/70">
      <div className="mb-2 flex items-center gap-2 font-bold text-gold">
        <Zap className="h-4 w-4" /> לחיבור נתונים חיים (עוקבים, חשיפה, מעורבות, פוסטים)
      </div>
      <p>נדרש חיבור Meta Graph API חד-פעמי. הצעדים (שלך — לעולם לא בצ'אט):</p>
      <ol className="mt-2 list-decimal space-y-1 pe-5 text-cream/60">
        <li>ודא שהאינסטגרם הוא חשבון עסקי/יוצר ומקושר לעמוד הפייסבוק.</li>
        <li>צור אפליקציה ב-developers.facebook.com והפק Long-Lived Page Access Token + מזהה IG Business.</li>
        <li>הוסף ב-Vercel (Server-only): <code className="text-gold" dir="ltr">META_PAGE_ACCESS_TOKEN</code>, <code className="text-gold" dir="ltr">META_IG_USER_ID</code>, <code className="text-gold" dir="ltr">META_PAGE_ID</code>.</li>
      </ol>
      <p className="mt-2 text-cream/50">ברגע שהערכים יתווספו — המסך הזה יתמלא אוטומטית בנתונים אמיתיים.</p>
    </div>
  );
}
