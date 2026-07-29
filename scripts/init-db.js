#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hdeoeycbpuxwtabuhawz.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8N3XCCjaQ4puMT0ETrtOFQ_BOXwE_Oc'

async function initDB() {
  try {
    console.log('📂 Reading SQL file...')
    const sqlPath = path.join(__dirname, '../supabase-init.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('🚀 Executing SQL on Supabase...')
    console.log('📍 URL:', SUPABASE_URL)

    // Split by -- statements and execute
    const statements = sql
      .split(';\n')
      .filter(s => s.trim() && !s.trim().startsWith('--'))
      .map(s => s.trim() + ';')

    let success = 0
    for (const stmt of statements) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({ query: stmt }),
        })

        if (response.ok) {
          success++
        }
      } catch (e) {
        console.log('⚠️  Skipped:', stmt.substring(0, 50))
      }
    }

    console.log(`✅ Database initialized! (${success} statements executed)`)
    console.log('🎉 Run: npm run dev')
  } catch (e) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  }
}

initDB()
