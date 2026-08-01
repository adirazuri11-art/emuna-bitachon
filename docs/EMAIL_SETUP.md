# Email Campaigns Setup — אמונה וביטחון

## סטטוס: ✅ באפליקציה

הביצוע בשלבים — כל קומפוננט וAPI מחובר לתיבה הדינמית.

---

## 📧 כנן קמפיינים

### 1. Welcome Email (חברות מועדון חדשה)
- **Trigger:** משתמש נרשם למועדון
- **Template:** Welcome Club Email
- **Timing:** מיידי
- **Content:** 
  - ברכה אישית ✋
  - קופון ייחודי 15% 🎁
  - הודעה על הטבות חברות
  - קישור לחזרה לחנות

**Implementation:**
```typescript
// API endpoint: POST /api/coupons/generate
// Called from: NewsletterForm.tsx or signup page
// Data: { email, firstName, discountPercentage: 15 }
```

---

### 2. Cart Abandonment (עגלה נשכחה)

#### Phase 1: 1 hour after abandonment
- **Template:** CART_ABANDONMENT_1H
- **Content:**
  - "שכחת משהו?"
  - תמונת המוצר ב-cart
  - סיכום המחיר
  - קישור חזרה לעגלה

#### Phase 2: 24 hours after abandonment
- **Template:** CART_ABANDONMENT_24H
- **Content:**
  - "הודעה אחרונה"
  - אזהרה מלאי מוגבל
  - כפתור להשלמת קנייה

---

### 3. Post-Purchase Follow-up (3 ימים אחרי קנייה)
- **Trigger:** הזמנה בוצעה בהצלחה
- **Template:** POST_PURCHASE_FOLLOWUP
- **Content:**
  - תמונת המוצר
  - הודעה לצילום + ביקורת
  - הנחה של 5 ש"ח לביקורת עתידית

---

### 4. Newsletter (שבועי)
- **Frequency:** כל שישי בבוקר
- **Segment:** All active subscribers
- **Content:**
  - חדש בקטלוג השבוע
  - הודעה על חגים קרובים
  - טיפ שבועי
  - מבצע בלעדי

---

### 5. VIP Exclusive (חברים בלבד)
- **Frequency:** כ-monthly
- **Segment:** Club Members Only
- **Content:**
  - Exclusive sale on premium products
  - Early access to new collections
  - Special pricing (25% off selected items)

---

### 6. Win-Back Campaign (non-active 60+ days)
- **Trigger:** משתמש לא קנה 60 ימים
- **Template:** WIN_BACK_60D
- **Content:**
  - "חברנו {firstName}, אנחנו מחכים לך"
  - 20% הנחה על קנייה חדשה
  - "בואו נדבר בוואטסאפ"

---

### 7. Holiday Campaigns
- **Passover:** Custom sets for Seder & Havdalah
- **Hanukkah:** Hanukkiot & candles
- **Rosh Hashanah:** Family gift packages

---

## 🔧 Implementation Checklist

### Database Setup
- [ ] Create `club_members` table
- [ ] Create `coupons` table
- [ ] Create `email_campaigns` table
- [ ] Create `email_events` table (for tracking opens/clicks)
- [ ] Create `user_preferences` table

**SQL:** See `/lib/db-schema-updates.sql`

### API Endpoints ✅
- [x] POST `/api/coupons/generate` — Issue new coupon
- [x] POST `/api/coupons/validate` — Check if coupon is valid
- [x] POST `/api/coupons/redeem` — Mark coupon as used

### Frontend Components
- [x] CouponApplier.tsx — Coupon input in checkout
- [x] MemberPricingBadge.tsx — Display member-only prices
- [x] TrustAndSocialProof.tsx — Social proof on homepage
- [ ] CartAbandonmentModal.tsx — Offer before leaving cart
- [ ] NewsletterSignup.tsx — Link to full signup flow

### Event Tracking ✅
- [x] GA4 events for all conversions
- [x] trackEvent() helper function
- [x] trackPurchase() for order conversion
- [x] trackCouponUsed() for discount tracking

---

## 📊 Success Metrics

### Expected Outcomes (90 days)

| Metric | Target | Current |
|--------|--------|---------|
| Newsletter subscribers | 500+ | TBD |
| Coupon redemption rate | 30% | TBD |
| Cart abandonment recovery | 15-20% | TBD |
| Email open rate | 25%+ | TBD |
| Email click rate | 5%+ | TBD |
| Member-only sales % | 20-25% | TBD |

---

## 🚀 Launch Timeline

### Week 1: Foundation
- Database schema setup
- API endpoints tested
- Components deployed

### Week 2-3: Campaigns
- Welcome email live
- Cart abandonment active
- Post-purchase follow-up

### Week 4+: Optimization
- Newsletter weekly sends
- Holiday campaigns
- Win-back automation

---

## 🔐 Email Service Integration

Currently using: **EmailJS** (configured in layout.tsx)

To switch to Sendgrid/Brevo/Mailgun:
1. Update environment variables
2. Create new email service adapter
3. Replace EmailJS calls with new service

---

## 📝 Notes

- All coupon codes are unique and tracked in database
- Single-use per email address (enforced by API)
- 60-day expiration window
- Hebrew text fully supported in all emails
- RTL formatting applied to all email templates
