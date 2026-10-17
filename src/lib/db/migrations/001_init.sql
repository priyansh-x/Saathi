-- Phase 1 schema. Applied by src/lib/db/client.ts on boot.
-- Supabase: run this file in the SQL editor when SUPABASE_URL is set.

create table if not exists parents (
  id text primary key,
  full_name text not null,
  first_name text not null,
  city text not null,
  timezone text not null default 'Asia/Kolkata',
  phone text not null,
  languages text not null default 'hi,en',
  call_time text not null,
  paused boolean not null default false,
  recording_consent boolean not null default false,
  is_example boolean not null default false
);

create table if not exists contacts (
  id text primary key,
  parent_id text not null references parents(id),
  role text not null,
  full_name text not null,
  first_name text not null,
  phone text not null,
  locale text not null default 'en',
  is_example boolean not null default false
);

create table if not exists medicines (
  id text primary key,
  parent_id text not null references parents(id),
  name text not null,
  dose text not null,
  appearance text not null,
  meal text not null,
  is_example boolean not null default false
);

create table if not exists schedules (
  id text primary key,
  medicine_id text not null references medicines(id),
  time_local text not null,
  is_example boolean not null default false
);

create table if not exists calls (
  id text primary key,
  parent_id text not null references parents(id),
  started_at text not null,
  ended_at text,
  duration_sec integer,
  status text not null,
  summary_en text,
  summary_hi text,
  mood_quote text,
  mood_quote_lang text,
  transcript_json text,
  recording_url text,
  bolna_execution_id text,
  is_example boolean not null default false
);

create table if not exists call_attempts (
  id text primary key,
  call_id text not null references calls(id),
  attempted_at text not null,
  offset_min integer not null,
  result text not null,
  is_example boolean not null default false
);

create table if not exists dose_logs (
  id text primary key,
  parent_id text not null references parents(id),
  call_id text,
  medicine_id text not null references medicines(id),
  schedule_date text not null,
  status text not null,
  said text,
  is_example boolean not null default false
);

create table if not exists alerts (
  id text primary key,
  parent_id text not null references parents(id),
  call_id text,
  category text not null,
  level text not null,
  quote text not null,
  created_at text not null,
  acked_at text,
  acked_by text,
  resolved_at text,
  late boolean not null default false,
  source text not null default 'mid_call',
  is_example boolean not null default false
);

create table if not exists alert_events (
  id text primary key,
  alert_id text not null references alerts(id),
  at text not null,
  kind text not null,
  actor text,
  note text,
  is_example boolean not null default false
);

create table if not exists memory_notes (
  id text primary key,
  parent_id text not null,
  call_id text,
  kind text not null,
  note text not null,
  is_example boolean not null default false
);

create table if not exists consents (
  id text primary key,
  parent_id text not null,
  kind text not null,
  granted boolean not null,
  at text not null,
  evidence text,
  is_example boolean not null default false
);

create table if not exists outbound_messages (
  id text primary key,
  parent_id text not null,
  channel text not null,
  template text not null,
  to_phone text not null,
  body text not null,
  at text not null,
  status text not null,
  is_example boolean not null default false
);

create table if not exists webhook_events (
  id text primary key,
  source text not null,
  execution_id text,
  payload text not null,
  at text not null,
  processed boolean not null default false
);

create table if not exists magic_links (
  token text primary key,
  parent_id text not null references parents(id),
  expires_at text not null,
  is_example boolean not null default false
);
