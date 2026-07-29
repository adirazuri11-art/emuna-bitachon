#!/usr/bin/env python3
import os
import sys

try:
    from supabase import create_client
except:
    print("📦 Installing supabase...")
    os.system("pip install supabase -q")
    from supabase import create_client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://hdeoeycbpuxwtabuhawz.supabase.co")
ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_8N3XCCjaQ4puMT0ETrtOFQ_BOXwE_Oc")

client = create_client(SUPABASE_URL, ANON_KEY)

print(f"🚀 Initializing Supabase Database")
print(f"📍 Project: {SUPABASE_URL}")

# Read SQL file
sql_path = os.path.join(os.path.dirname(__file__), "../supabase-init.sql")
with open(sql_path, 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Split statements
statements = [s.strip() + ";" for s in sql_content.split(";") if s.strip() and not s.strip().startswith("--")]

print(f"📝 Found {len(statements)} SQL statements\n")

executed = 0
skipped = 0

for i, stmt in enumerate(statements, 1):
    try:
        # Try to execute via RPC or direct query
        response = client.table('information_schema.tables').select("*").limit(1).execute()
        print(f"✅ Table check OK")
        break
    except Exception as e:
        print(f"⚠️  Connection test: {str(e)[:60]}")
        break

print(f"""
❌ Supabase Database requires one of:
   1. Service Role Key (SERVER-SIDE ONLY)
   2. Direct PostgreSQL Connection + Password
   3. Supabase Dashboard SQL Editor (manual run)

✅ SOLUTION: Copy supabase-init.sql content to:
   https://hdeoeycbpuxwtabuhawz.supabase.co → SQL Editor → Run

📌 For now, app uses Fallback Mode (localStorage)
""")
