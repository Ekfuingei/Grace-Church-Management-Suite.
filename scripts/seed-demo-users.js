/**
 * Seeds demo users in Supabase Auth.
 * Run: npm run seed:demo-users
 * Requires: .env with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env manually (no dotenv dependency)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const env = readFileSync(envPath, 'utf8')
    for (const line of env.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    }
  } catch {
    console.error('Could not load .env file')
  }
}

loadEnv()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_USERS = [
  { email: 'admin@demo.gracechurch.org', password: 'demo123', role: 'admin', full_name: 'Demo Admin' },
  { email: 'media@demo.gracechurch.org', password: 'demo123', role: 'media', full_name: 'Demo Media Operator' },
]

async function seed() {
  console.log('Seeding demo users...\n')

  for (const user of DEMO_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role, full_name: user.full_name },
    })

    if (error) {
      if (error.message?.includes('already been registered')) {
        console.log(`✓ ${user.email} (already exists)`)
      } else {
        console.error(`✗ ${user.email}:`, error.message)
        if (error.message?.includes('Database error')) {
          console.error('  → Run the migrations in Supabase SQL Editor first (supabase/migrations/*.sql)')
        }
      }
    } else {
      console.log(`✓ ${user.email} created (${user.role})`)
    }
  }

  console.log('\nDone. Demo credentials:')
  console.log('  Admin: admin@demo.gracechurch.org / demo123')
  console.log('  Media: media@demo.gracechurch.org / demo123')
}

seed().catch(console.error)
