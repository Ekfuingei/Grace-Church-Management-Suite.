/**
 * Run Supabase migrations against the database.
 * Requires: .env with SUPABASE_DB_URL or SUPABASE_DB_POOLER_URL
 *
 * Run: npm run db:migrate
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import pg from 'pg'

const { Client } = pg

// Load .env
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

const dbUrl = process.env.SUPABASE_DB_URL || process.env.SUPABASE_DB_POOLER_URL

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL or SUPABASE_DB_POOLER_URL in .env')
  process.exit(1)
}

const migrationsDir = resolve(process.cwd(), 'supabase', 'migrations')

async function runMigrations() {
  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    console.log('Connected to database.\n')

    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const name = file.replace('.sql', '')
      const { rows } = await client.query(
        'SELECT 1 FROM _migrations WHERE name = $1',
        [name]
      )

      if (rows.length > 0) {
        console.log(`⏭  ${file} (already applied)`)
        continue
      }

      const sqlPath = join(migrationsDir, file)
      const sql = readFileSync(sqlPath, 'utf8')

      try {
        await client.query(sql)
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name])
        console.log(`✓  ${file}`)
      } catch (err) {
        console.error(`✗  ${file}:`, err.message)
        throw err
      }
    }

    console.log('\nMigrations complete.')
  } finally {
    await client.end()
  }
}

runMigrations().catch((err) => {
  console.error(err)
  process.exit(1)
})
