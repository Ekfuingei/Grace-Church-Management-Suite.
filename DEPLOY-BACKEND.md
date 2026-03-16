# Deploy Backend (Supabase)

The backend is Supabase — it's already hosted. You just need to run the schema.

## Option 1: Supabase SQL Editor (recommended)

1. Open your project: **https://supabase.com/dashboard/project/kabhwfzcrgvjvhrdgsup**
2. Go to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/deploy-backend.sql`
5. Paste and click **Run**

## Option 2: CLI migration (when DB is reachable)

```bash
npm run db:migrate
```

Requires `SUPABASE_DB_URL` or `SUPABASE_DB_POOLER_URL` in `.env`.

## After deployment: Create demo users

```bash
npm run seed:demo-users
```

Or add manually in **Authentication → Users → Add user**:
- Admin: `admin@demo.gracechurch.org` / `demo123`
- Media: `media@demo.gracechurch.org` / `demo123`

Set **User Metadata** → `role` to `admin` or `media` for each.
