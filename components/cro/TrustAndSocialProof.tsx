'use client';

import { CheckCircle, Users, Package, RotateCcw } from 'lucide-react';

export function TrustAndSocialProof() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {/* חברים פעילים */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
            <Users className="h-6 w-6 text-gold" />
          </div>
          <p className="text-3xl font-bold text-navy">600+</p>
          <p className="mt-1 text-sm text-navy/70">חברי מועדון פעילים</p>
          <p className="mt-2 text-xs text-navy/50">קהילה של אנשים שמעריכים יודאיקה</p>
        </div>

        {/* הזמנות שנשלחו */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
            <Package className="h-6 w-6 text-gold" />
          </div>
          <p className="text-3xl font-bold text-navy">2000+</p>
          <p className="mt-1 text-sm text-navy/70">הזמנות ממולאות</p>
          <p className="mt-2 text-xs text-navy/50">באיכות גבוהה וביעילות</p>
        </div>

        {/* כשרות מאומתת */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
            <CheckCircle className="h-6 w-6 text-gold" />
          </div>
          <p className="text-3xl font-bold text-navy">100%</p>
          <p className="mt-1 text-sm text-navy/70">כשרות מאומתת</p>
          <p className="mt-2 text-xs text-navy/50">תעודות מרבנים מוסמכים</p>
        </div>

        {/* החזרות בטוחות */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
            <RotateCcw className="h-6 w-6 text-gold" />
          </div>
          <p className="text-3xl font-bold text-navy">30 יום</p>
          <p className="mt-1 text-sm text-navy/70">החזרה ללא שאלות</p>
          <p className="mt-2 text-xs text-navy/50">משלוח חינם להחזרות</p>
        </div>
      </div>

      {/* Call to action למועדון */}
      <div className="mt-12 rounded-2xl border border-gold/25 bg-gradient-to-r from-navy/5 to-gold/5 p-8 text-center">
        <h3 className="font-display text-2xl font-bold text-navy">הצטרפו למועדון - קבלו 10% הנחה</h3>
        <p className="mt-2 text-navy/70">כל הזמנה ראשונה כחבר מועדון זוכה ל-10% הנחה בקופון שנשלח במייל</p>
        <p className="mt-1 text-sm text-gold">+ תקבלו עדכונים על קולקציות חדשות ומבצעים בלעדיים</p>
      </div>
    </section>
  );
}
