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
  BEGIN
    INSERT INTO admin_users (id, email, full_name, role)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Don't block user creation if admin_users missing
  END;
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

-- ============================================
-- Additional Tables for CMS Modules
-- ============================================

-- Enums for services, giving, attendance, etc.
DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('Sunday Morning', 'Sunday Evening', 'Midweek', 'Special', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE giving_type AS ENUM ('Tithe', 'First Fruit', 'Offering', 'Special Seed', 'Building Fund', 'Mission Fund', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('Cash', 'Mobile Money', 'Bank Transfer', 'Cheque', 'Card');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'First Timer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rota_assignment_status AS ENUM ('Confirmed', 'Pending', 'Declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pipeline_stage AS ENUM ('New Contact', 'First Visit', 'Regular', 'Membership Class', 'Full Member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE counselling_case_status AS ENUM ('Open', 'In Progress', 'Closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'No Show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  service_type service_type NOT NULL DEFAULT 'Sunday Morning',
  theme TEXT,
  preacher TEXT,
  total_present INT DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'Present',
  arrived_late BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, member_id)
);

-- Giving records
CREATE TABLE IF NOT EXISTS giving_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  giving_type giving_type NOT NULL DEFAULT 'Tithe',
  payment_method payment_method NOT NULL DEFAULT 'Cash',
  date DATE NOT NULL,
  service_type service_type,
  recorded_by UUID REFERENCES admin_users(id),
  notes TEXT,
  receipt_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments (for rota)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#A67C52',
  max_volunteers INT DEFAULT 5,
  coordinator_id UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rota assignments
CREATE TABLE IF NOT EXISTS rota_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role TEXT,
  status rota_assignment_status NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, member_id, department_id)
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT,
  category TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  start_date DATE,
  expiry_date DATE,
  image_url TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evangelism contacts
CREATE TABLE IF NOT EXISTS evangelism_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  source TEXT,
  first_contact_date DATE,
  initial_outcome TEXT,
  pipeline_stage pipeline_stage NOT NULL DEFAULT 'New Contact',
  assigned_to UUID REFERENCES admin_users(id),
  next_followup_date DATE,
  notes TEXT,
  converted_to_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up activities
CREATE TABLE IF NOT EXISTS followup_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES evangelism_contacts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  outcome TEXT,
  next_step TEXT,
  logged_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counselling cases
CREATE TABLE IF NOT EXISTS counselling_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status counselling_case_status NOT NULL DEFAULT 'Open',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counselling appointments
CREATE TABLE IF NOT EXISTS counselling_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  counsellor_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  appointment_type TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  location TEXT,
  status appointment_status NOT NULL DEFAULT 'Scheduled',
  is_urgent BOOLEAN DEFAULT FALSE,
  case_id UUID REFERENCES counselling_cases(id) ON DELETE SET NULL,
  booked_by UUID REFERENCES admin_users(id),
  notes_for_counsellor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session notes
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES counselling_appointments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  action_items TEXT,
  next_appointment_recommended BOOLEAN DEFAULT FALSE,
  risk_flag BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE giving_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rota_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evangelism_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselling_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselling_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access services" ON services;
CREATE POLICY "Authenticated full access services" ON services FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access attendance_records" ON attendance_records;
CREATE POLICY "Authenticated full access attendance_records" ON attendance_records FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access giving_records" ON giving_records;
CREATE POLICY "Authenticated full access giving_records" ON giving_records FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access departments" ON departments;
CREATE POLICY "Authenticated full access departments" ON departments FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access rota_assignments" ON rota_assignments;
CREATE POLICY "Authenticated full access rota_assignments" ON rota_assignments FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access announcements" ON announcements;
CREATE POLICY "Authenticated full access announcements" ON announcements FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access evangelism_contacts" ON evangelism_contacts;
CREATE POLICY "Authenticated full access evangelism_contacts" ON evangelism_contacts FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access followup_activities" ON followup_activities;
CREATE POLICY "Authenticated full access followup_activities" ON followup_activities FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access counselling_cases" ON counselling_cases;
CREATE POLICY "Authenticated full access counselling_cases" ON counselling_cases FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access counselling_appointments" ON counselling_appointments;
CREATE POLICY "Authenticated full access counselling_appointments" ON counselling_appointments FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated full access session_notes" ON session_notes;
CREATE POLICY "Authenticated full access session_notes" ON session_notes FOR ALL USING (auth.role() = 'authenticated');

-- Updated_at triggers for new tables
DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
DROP TRIGGER IF EXISTS departments_updated_at ON departments;
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
DROP TRIGGER IF EXISTS evangelism_contacts_updated_at ON evangelism_contacts;
CREATE TRIGGER evangelism_contacts_updated_at BEFORE UPDATE ON evangelism_contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
DROP TRIGGER IF EXISTS counselling_cases_updated_at ON counselling_cases;
CREATE TRIGGER counselling_cases_updated_at BEFORE UPDATE ON counselling_cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
DROP TRIGGER IF EXISTS counselling_appointments_updated_at ON counselling_appointments;
CREATE TRIGGER counselling_appointments_updated_at BEFORE UPDATE ON counselling_appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
