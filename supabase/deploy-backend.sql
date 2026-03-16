-- Grace Church Management Suite - Full Backend Deployment
-- Run this entire file in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- Replace YOUR_PROJECT with your project ref (e.g. kabhwfzcrgvjvhrdgsup)

-- ============================================
-- Migration 00001: Initial Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS church_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_name TEXT NOT NULL DEFAULT 'Grace Church',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'XAF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO church_settings (church_name, currency)
SELECT 'Grace Church', 'XAF'
WHERE NOT EXISTS (SELECT 1 FROM church_settings LIMIT 1);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'media', 'volunteer_coordinator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('Visitor', 'Regular', 'Member', 'Inactive', 'Transferred');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Prefer not to say');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  member_id TEXT NOT NULL UNIQUE,
  status member_status NOT NULL DEFAULT 'Visitor',
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender gender_type,
  join_date DATE,
  address TEXT,
  cell_group TEXT,
  departments TEXT[],
  photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS TRIGGER AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_id FROM 4) AS INT)), 0) + 1 INTO next_num
  FROM members WHERE member_id ~ '^GC-[0-9]+$';
  NEW.member_id := 'GC-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_member_id ON members;
CREATE TRIGGER trg_member_id BEFORE INSERT ON members
  FOR EACH ROW WHEN (NEW.member_id IS NULL OR NEW.member_id = '')
  EXECUTE PROCEDURE generate_member_id();

CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_users (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_admin_user();

ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access church_settings" ON church_settings;
CREATE POLICY "Admins full access church_settings" ON church_settings
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins full access admin_users" ON admin_users;
CREATE POLICY "Admins full access admin_users" ON admin_users
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins full access members" ON members;
CREATE POLICY "Admins full access members" ON members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS church_settings_updated_at ON church_settings;
CREATE TRIGGER church_settings_updated_at BEFORE UPDATE ON church_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
CREATE TRIGGER admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS members_updated_at ON members;
CREATE TRIGGER members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
