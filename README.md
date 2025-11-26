## RythmIQ

RythmIQ (a.k.a. RythmIQ) is a Vite + React dashboard that now uses [Supabase](https://supabase.com) for authentication, storage, and real-time transaction tracking. This document walks through the local setup, required environment variables, and Supabase schema expectations.

### Prerequisites

- Node.js 20+
- Supabase project with SQL access
- npm

### Installation

```bash
npm install
cp .env.example .env.local # or manually create the env file
npm run dev
```

### Environment variables

Create `.env.local` (Vite automatically loads `VITE_` prefixed values) and add:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Restart `npm run dev` whenever the env file changes.

### Supabase schema

Run the bootstrap SQL script inside the Supabase SQL Editor (or via `supabase db push`):

```
scripts/01_init_database.sql
```

It creates:

- `profiles` – metadata for each `auth.users` row
- `transactions` – unified income/expense ledger with realtime events
- `financial_goals` – used in the dashboard goals tab
- `coaching_insights` & `coaching_summary` – backing data for the AI coaching tab

The script also enables Row Level Security and policies that allow each authenticated user to read/write only their own records. If you need server-side automations, execute them with the Supabase service role so they satisfy the policies that mention `auth.role() = 'service_role'`.

### Local development

1. Ensure the Supabase tables exist and the anon key has the right policies (see above).
2. Start the dev server with `npm run dev` and visit the URL Vite prints.
3. Sign up via the UI. The app writes a profile row and stores transactions/goals under your authenticated user.

### Notes

- Transactions update in real time thanks to Supabase Realtime channels.
- Auth-protected routes (`/dashboard`, `/dashboard/track`) redirect to `/login` when the session expires.
- To seed data manually use the SQL console or Supabase table editor.
