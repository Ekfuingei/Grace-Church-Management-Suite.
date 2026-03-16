# Grace Church Management Suite

A unified web-based platform for church operations — media prompting, tithe recording, attendance, volunteer rota, announcements, evangelism tracking, and counselling scheduling.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI primitives
- **Database:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel / Netlify ready

## Getting Started

### Demo mode (no setup required)

Deploy without Supabase for a quick demo. **Omit** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or leave them empty).

**Demo credentials:**
- **Admin** (full access): `admin@demo.gracechurch.org` / `demo123`
- **Media Operator** (Media Prompter only): `media@demo.gracechurch.org` / `demo123`

Members, settings, and other data won't persist (no database). Perfect for showcasing the UI.

---

### Full setup (with Supabase)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in **SQL Editor** → paste contents of `supabase/migrations/00001_initial_schema.sql`
3. Enable Email auth in Authentication → Providers
4. Create an admin user via Authentication → Users → Add user

### 3. Configure environment

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npm run dev
```

## Project Structure

```
src/
├── components/     # UI components
│   ├── layout/     # Sidebar, BottomNav, AppLayout
│   ├── members/    # Member CRUD
│   ├── shared/     # PageHeader, EmptyState, StatCard, MemberSearchInput, etc.
│   └── ui/         # Button, Input, Card, Label
├── contexts/       # AuthContext
├── lib/            # Supabase client, utils
├── pages/          # Route pages
└── types/          # TypeScript types
```

## Development Roadmap

- **Phase 1** ✅ Foundation (Auth, Members, Settings, Navigation)
- **Phase 2** Media Prompter enhancements, Tithe & Offering, Attendance
- **Phase 3** Rota, Announcements, Dashboard stats
- **Phase 4** Evangelism, Counselling, Reports
- **Phase 5** Offline support, PWA, Polish

## Design System

- **Background:** #F9F8F5 (warm white)
- **Accent:** #B8962E (gold)
- **Fonts:** DM Sans (UI), Cinzel (display)
