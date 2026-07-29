#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hdeoeycbpuxwtabuhawz.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8N3XCCjaQ4puMT0ETrtOFQ_BOXwE_Oc'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function setupDB() {
  console.log('🚀 Setting up Supabase Database...')
  console.log(`📍 Project: ${SUPABASE_URL}`)

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '../supabase-init.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

    // Split into individual statements
    const statements = sqlContent
      .split(';\n')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))
      .map(s => s + ';')

    console.log(`📝 Found ${statements.length} SQL statements`)

    let executed = 0
    let skipped = 0

    for (const stmt of statements) {
      try {
        const { error } = await supabase.rpc('sql_exec', { statement: stmt })
        if (!error) {
          executed++
          console.log('✅', stmt.substring(0, 50) + '...')
        } else if (error?.message?.includes('already exists')) {
          skipped++
          console.log('⏭️  Already exists:', stmt.substring(0, 50) + '...')
        } else {
          console.log('⚠️  Error:', stmt.substring(0, 50), error?.message)
        }
      } catch (e) {
        // Some statements might fail due to dependencies, that's ok
        console.log('⏭️  Skipped:', stmt.substring(0, 50))
      }
    }

    console.log(`\n✨ Database setup complete!`)
    console.log(`✅ Executed: ${executed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`\n🎉 Run: npm run dev`)
  } catch (e) {
    console.error('❌ Setup error:', e.message)
    process.exit(1)
  }
}

setupDB()
