#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.hdeoeycbpuxwtabuhawz:Emuna2026emuna@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📝 Reading SQL file...');
    const sqlPath = path.join(__dirname, '../supabase-init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('⚡ Executing SQL...');
    await client.query(sql);
    console.log('✨ Migration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
