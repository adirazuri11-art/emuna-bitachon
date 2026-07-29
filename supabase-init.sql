-- אמונה וביטחון — Supabase Database Schema Init
-- העתק את הקוד הזה לSupabase SQL Editor → בחר Run

-- ============== ENUMS ==============
CREATE TYPE role_enum AS ENUM ('CUSTOMER', 'SUPPLIER', 'ADMIN');
CREATE TYPE nusach_enum AS ENUM ('ASHKENAZ', 'SEFARD', 'EDOT_MIZRACH', 'CHABAD', 'TEIMANI');
CREATE TYPE kashrut_level_enum AS ENUM ('STANDARD', 'MEHADRIN', 'BADATZ', 'STAM_CERTIFIED');
CREATE TYPE order_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE currency_enum AS ENUM ('ILS', 'USD', 'EUR');
CREATE TYPE customization_type_enum AS ENUM ('ENGRAVING', 'EMBROIDERY', 'WEAVING', 'PRINT');

-- ============== USERS ==============
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT,
  name TEXT,
  phone TEXT,
  role role_enum DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "User"(email);

-- ============== HALACHIC PREFERENCES ==============
CREATE TABLE "HalachicPreference" (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  nusach nusach_enum,
  "preferredKashrutOrgs" TEXT[],
  "tzitzitKnotStyle" TEXT,
  "preferredMezuzahScript" TEXT,
  notes TEXT,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============== ADDRESSES ==============
CREATE TABLE "Address" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "fullName" TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'IL',
  phone TEXT,
  "isDefault" BOOLEAN DEFAULT false
);

-- ============== CATEGORIES ==============
CREATE TABLE "Category" (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  "nameHe" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "parentId" TEXT REFERENCES "Category"(id),
  "sortOrder" INTEGER DEFAULT 0
);

-- ============== SUPPLIERS ==============
CREATE TABLE "Supplier" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "integrationType" TEXT DEFAULT 'MANUAL',
  "apiEndpoint" TEXT,
  "webhookSecret" TEXT,
  "contactEmail" TEXT,
  "leadTimeDays" INTEGER DEFAULT 7,
  "wholesaleDiscountPct" NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============== PRODUCTS ==============
CREATE TABLE "Product" (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "titleHe" TEXT NOT NULL,
  "titleEn" TEXT,
  "descriptionHe" TEXT,
  "descriptionEn" TEXT,
  "basePrice" NUMERIC(10,2) NOT NULL,
  "discountPrice" NUMERIC(10,2),
  currency currency_enum DEFAULT 'ILS',
  material TEXT,
  "weightGrams" INTEGER,
  dimensions JSONB,
  stock INTEGER DEFAULT 0,
  "lowStockAlert" INTEGER DEFAULT 3,
  "kashrutLevel" kashrut_level_enum,
  "isCustomizable" BOOLEAN DEFAULT false,
  images TEXT[],
  "categoryId" TEXT REFERENCES "Category"(id),
  "supplierId" TEXT REFERENCES "Supplier"(id),
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_category ON "Product"("categoryId");
CREATE INDEX idx_product_supplier ON "Product"("supplierId");
CREATE INDEX idx_product_active_stock ON "Product"(active, stock);

-- ============== PRODUCT VARIANTS ==============
CREATE TABLE "ProductVariant" (
  id TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  "nameHe" TEXT NOT NULL,
  "priceDelta" NUMERIC(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  attributes JSONB
);

CREATE INDEX idx_variant_product ON "ProductVariant"("productId");

-- ============== CUSTOMIZATION RULES ==============
CREATE TABLE "CustomizationRule" (
  id TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  type customization_type_enum NOT NULL,
  "maxChars" INTEGER DEFAULT 30,
  "allowedFonts" TEXT[],
  surcharge NUMERIC(10,2) DEFAULT 0,
  "previewTemplateUrl" TEXT
);

CREATE INDEX idx_customization_product ON "CustomizationRule"("productId");

-- ============== KASHRUT CERTIFICATES ==============
CREATE TABLE "KashrutCertificate" (
  id TEXT PRIMARY KEY,
  "productId" TEXT REFERENCES "Product"(id) ON DELETE CASCADE,
  "supplierId" TEXT REFERENCES "Supplier"(id),
  organization TEXT NOT NULL,
  "certificateNumber" TEXT,
  "issuedAt" TIMESTAMP NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "documentUrl" TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  "lastVerifiedAt" TIMESTAMP
);

CREATE INDEX idx_certificate_product_status ON "KashrutCertificate"("productId", status);
CREATE INDEX idx_certificate_expiry ON "KashrutCertificate"("expiresAt");

-- ============== ORDERS ==============
CREATE TABLE "Order" (
  id TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  status order_status_enum DEFAULT 'PENDING',
  "paymentStatus" payment_status_enum DEFAULT 'PENDING',
  currency currency_enum DEFAULT 'ILS',
  subtotal NUMERIC(10,2) NOT NULL,
  "shippingCost" NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  "shippingAddressId" TEXT REFERENCES "Address"(id),
  "trackingUrl" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_user ON "Order"("userId");
CREATE INDEX idx_order_status_date ON "Order"(status, "createdAt");

-- ============== ORDER ITEMS ==============
CREATE TABLE "OrderItem" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"(id),
  "variantId" TEXT REFERENCES "ProductVariant"(id),
  quantity INTEGER DEFAULT 1,
  "unitPrice" NUMERIC(10,2) NOT NULL,
  customization JSONB
);

CREATE INDEX idx_orderitem_order ON "OrderItem"("orderId");

-- ============== AI INTERACTIONS ==============
CREATE TABLE "AIInteraction" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  "sessionId" TEXT NOT NULL,
  feature TEXT NOT NULL,
  query TEXT NOT NULL,
  "responseSummary" TEXT,
  converted BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_session ON "AIInteraction"("sessionId");
CREATE INDEX idx_ai_feature_date ON "AIInteraction"(feature, "createdAt");

-- ============== RECOMMENDATIONS ==============
CREATE TABLE "Recommendation" (
  id TEXT PRIMARY KEY,
  "interactionId" TEXT NOT NULL REFERENCES "AIInteraction"(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"(id),
  score FLOAT NOT NULL,
  clicked BOOLEAN DEFAULT false,
  purchased BOOLEAN DEFAULT false
);

CREATE INDEX idx_recommendation_interaction ON "Recommendation"("interactionId");

-- ============== CLUB MEMBERS ==============
CREATE TABLE "ClubMember" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "couponCode" TEXT UNIQUE NOT NULL,
  "couponUsed" BOOLEAN DEFAULT false,
  "couponUsedAt" TIMESTAMP,
  "couponExpires" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clubmember_coupon ON "ClubMember"("couponCode");
CREATE INDEX idx_clubmember_email ON "ClubMember"(email);

-- ============== DONE ==============
-- ✅ Schema created successfully!
-- Run: npm run dev (in your terminal)
