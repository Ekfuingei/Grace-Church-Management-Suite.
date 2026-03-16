# Deploy Backend (Supabase)

The backend is Supabase — it's already hosted. You just need to run the schema.

## Step 1: Run schema in Supabase SQL Editor

1. Open **https://supabase.com/dashboard/project/kabhwfzcrgvjvhrdgsup/sql**
2. Click **New query**
3. Copy the entire contents of `supabase/deploy-backend.sql`
4. Paste and click **Run**

## Step 2: Create demo users

If you get "Database error creating new user" when running the seed:

1. In SQL Editor, run `supabase/pre-seed-drop-trigger.sql` (drops the trigger)
2. Run `npm run seed:demo-users`
3. Run `supabase/deploy-backend.sql` again to restore the trigger

Otherwise just run:

```bash
npm run seed:demo-users
```

**Or add manually** in Authentication → Users → Add user:
- Admin: `admin@demo.gracechurch.org` / `demo123` (metadata: `{"role":"admin"}`)
- Media: `media@demo.gracechurch.org` / `demo123` (metadata: `{"role":"media"}`)
