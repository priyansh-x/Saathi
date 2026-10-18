-- Landing waitlist. Apply in the Supabase SQL editor with the service role.
-- RLS is on and there are no policies, so only the service role can insert or read.

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  name text,
  contact text not null,
  location text,
  parent_city text,
  parent_language text,
  pilot_interest boolean not null default false,
  consent boolean not null,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;
