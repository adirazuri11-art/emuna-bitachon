-- Database Schema Updates for Newsletter & Coupon System
-- עדכוני סכמה לתמיכה בקופונים וקמפיינים דוא"ל

-- Table 1: Club Members (אם לא קיימת)
CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  subscription_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  marketing_consent BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Coupons (for tracking who got what)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  discount_percentage NUMERIC(5, 2) DEFAULT 15.00,
  discount_type VARCHAR(20) DEFAULT 'percentage', -- 'fixed' or 'percentage'
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  used_in_order_id UUID,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (email) REFERENCES club_members(email) ON DELETE CASCADE
);

-- Table 3: Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50), -- 'welcome', 'newsletter', 'cart_abandon', 'win_back'
  segment VARCHAR(100), -- 'all', 'club', 'inactive'
  subject_line TEXT,
  body_template TEXT,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'archived'
  scheduled_send_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 4: Email Events (Tracking Opens/Clicks)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50), -- 'sent', 'delivered', 'opened', 'clicked', 'complained', 'bounced'
  clicked_link_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (email) REFERENCES club_members(email) ON DELETE CASCADE
);

-- Table 5: User Preferences & Segments
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  preferred_language VARCHAR(10) DEFAULT 'he',
  newsletter_frequency VARCHAR(20) DEFAULT 'weekly', -- 'weekly', 'biweekly', 'monthly'
  communication_channel VARCHAR(50), -- 'email', 'sms', 'both'
  segment_tags TEXT[], -- ['high_value', 'dormant', 'new_customer']
  last_engaged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (email) REFERENCES club_members(email) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_coupons_email ON coupons(email);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_used ON coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_club_members_email ON club_members(email);
