-- Run this BEFORE npm run seed:demo-users if you get "Database error creating new user"
-- This temporarily removes the trigger so user creation can succeed.
-- Run the full deploy-backend.sql again afterward to restore the trigger.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
