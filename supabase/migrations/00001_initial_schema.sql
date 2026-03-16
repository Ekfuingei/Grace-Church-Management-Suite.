-- Grace Church Management Suite - Initial Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Church settings (single row per church)
CREATE TABLE church_settings (
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

-- Insert default church settings
INSERT INTO church_settings (church_name, currency) VALUES ('Grace Church', 'XAF');

-- Admin users profile (links to Supabase Auth)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'media', 'volunteer_coordinator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members (central table shared by all modules)
CREATE TYPE member_status AS ENUM ('Visitor', 'Regular', 'Member', 'Inactive', 'Transferred');
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Prefer not to say');

CREATE TABLE members (
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

-- Function to auto-generate member_id (e.g. GC-0042)
CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(member_id FROM 4) AS INT)
  ), 0) + 1 INTO next_num
  FROM members
  WHERE member_id ~ '^GC-[0-9]+$';
  NEW.member_id := 'GC-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: generate member_id when not provided
DROP TRIGGER IF EXISTS trg_member_id ON members;
CREATE TRIGGER trg_member_id
  BEFORE INSERT ON members
  FOR EACH ROW
  WHEN (NEW.member_id IS NULL OR NEW.member_id = '')
  EXECUTE PROCEDURE generate_member_id();

-- Auto-create admin_users on signup
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_admin_user();

-- RLS policies
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything (when authenticated)
CREATE POLICY "Admins full access church_settings" ON church_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access admin_users" ON admin_users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access members" ON members
  FOR ALL USING (auth.role() = 'authenticated');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER church_settings_updated_at
  BEFORE UPDATE ON church_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
