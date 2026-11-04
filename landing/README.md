# Saathi marketing site

Lives in `landing/` inside this repo. Copy lives in `lib/content.ts` so Hindi can be added later.

```bash
cd landing
npm install
cp .env.example .env.local   # names only; site runs without Supabase
npm run dev                  # http://127.0.0.1:43211
```

The family desk CTA reads `FAMILY_DESK_URL` or `NEXT_PUBLIC_FAMILY_DESK_URL`, defaulting to `https://x-navy-tau.vercel.app/`.

Waitlist POSTs to `/api/waitlist`. With `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` it inserts a row. In production without `SUPABASE_URL` it returns 503 (no local file on Vercel). Locally without Supabase it appends `.data/waitlist.json` (gitignored). It never emails, texts or dials.

```sql
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  contact text not null,
  location text,
  parent_city text,
  parent_language text,
  pilot_interest boolean default false,
  consent boolean not null
);
alter table waitlist enable row level security;
-- no public policies; only the service-role key can write or read
```

No analytics. No cookie banner.
