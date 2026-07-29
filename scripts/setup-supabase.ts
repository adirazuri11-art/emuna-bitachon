import fetch from 'node-fetch'

const PROJECT_ID = 'hdeoeycbpuxwtabuhawz'
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`
const ANON_KEY = 'sb_publishable_8N3XCCjaQ4puMT0ETrtOFQ_BOXwE_Oc'

async function createTables() {
  console.log('🚀 Setting up Supabase Database Schema...')

  const sqlStatements = [
    // Users
    `CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      "passwordHash" TEXT,
      name TEXT,
      phone TEXT,
      role TEXT DEFAULT 'CUSTOMER',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );`,

    // ClubMember
    `CREATE TABLE IF NOT EXISTS "ClubMember" (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      "couponCode" TEXT UNIQUE NOT NULL,
      "couponUsed" BOOLEAN DEFAULT false,
      "couponUsedAt" TIMESTAMP,
      "couponExpires" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );`,

    // Category
    `CREATE TABLE IF NOT EXISTS "Category" (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      "nameHe" TEXT NOT NULL,
      "nameEn" TEXT NOT NULL,
      "parentId" TEXT,
      "sortOrder" INTEGER DEFAULT 0
    );`,

    // Product
    `CREATE TABLE IF NOT EXISTS "Product" (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      "titleHe" TEXT NOT NULL,
      "titleEn" TEXT,
      "descriptionHe" TEXT,
      "descriptionEn" TEXT,
      "basePrice" DECIMAL NOT NULL,
      "discountPrice" DECIMAL,
      currency TEXT DEFAULT 'ILS',
      material TEXT,
      "weightGrams" INTEGER,
      dimensions JSONB,
      stock INTEGER DEFAULT 0,
      "lowStockAlert" INTEGER DEFAULT 3,
      "kashrutLevel" TEXT,
      "isCustomizable" BOOLEAN DEFAULT false,
      images TEXT[],
      "categoryId" TEXT,
      "supplierId" TEXT,
      active BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );`,

    // Order
    `CREATE TABLE IF NOT EXISTS "Order" (
      id TEXT PRIMARY KEY,
      "orderNumber" TEXT UNIQUE NOT NULL,
      "userId" TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      "paymentStatus" TEXT DEFAULT 'PENDING',
      currency TEXT DEFAULT 'ILS',
      subtotal DECIMAL NOT NULL,
      "shippingCost" DECIMAL DEFAULT 0,
      total DECIMAL NOT NULL,
      "shippingAddressId" TEXT,
      "trackingUrl" TEXT,
      notes TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );`,
  ]

  for (const sql of sqlStatements) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
      })

      if (!response.ok) {
        console.log('⚠️  Skipping (table may already exist):', sql.split('TABLE')[1]?.split('(')[0])
      } else {
        console.log('✅ Created table')
      }
    } catch (e) {
      console.log('⚠️  Error:', (e as Error).message)
    }
  }

  console.log('✨ Database setup complete!')
  console.log('📌 Run: npm run dev')
}

createTables().catch(console.error)
