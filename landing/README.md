# Saathi marketing site

v1, 17 Oct 2026. Lives in `landing/` inside the Saathi repo (not its own repository). Structure and motion follow a measured teardown of storeos.in; copy, tokens and mocks are Saathi's. Original engineering prompt kept conceptually as this brief — no storeOS text, logos or source.

```bash
cd landing
npm install
cp .env.example .env.local   # names only; site runs without Supabase
npm run dev                  # http://127.0.0.1:43211
```

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

## ⚑ CONFIRM before launch (Priyansh)

1. **FAQ cost** — draft: “Nothing during the pilot.” Do not treat as published pricing.
2. **FAQ who can hear calls** — draft: family sees a short summary; audio only if Maa agrees; neighbour never sees calls, medicines or mood.
3. **Languages live in the pilot** — Hindi, Hinglish, English shown as selectable; Tamil/Bengali chips say “soon”.
4. **Built with** — “Built with Bolna voice agents” only. Do not add Sarvam, Plivo or others until they are in the build.
5. **Landline** — not shown on Setup. Confirm before adding that chip.

The 36% “child who has migrated” stat was dropped (source not confirmed). WHO / UNFPA links are in the footer sources list.

No analytics. No cookie banner. Domain placeholder `<domain>` in the footer email.
