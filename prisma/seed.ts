import { supabase } from '../lib/supabase'

async function main() {
  console.log('🌱 Starting seed with Supabase Client...')

  try {
    // Test connection
    const { data, error } = await supabase
      .from('User')
      .select('COUNT(*)', { count: 'exact' })
      .limit(1)

    if (error?.code === 'PGRST202') {
      console.log('✅ Tables not yet created - creating now...')
      // Tables will be created on first prisma db push
    } else if (error) {
      console.log('⚠️ Connection check:', error.message)
    } else {
      console.log('✅ Database connected successfully')
    }

    console.log('✨ Seed would add sample data here')
    console.log('📌 For now, run: npm run db:push (after getting DB password)')
  } catch (e) {
    console.error('❌ Seed error:', e)
  }
}

main()
