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
  is_example boolean not null default false,
  consent_status text not null default 'pending',
  consent_at text,
  consent_later_count integer not null default 0,
  address_term text
);

create table if not exists auth_tokens (
  token text primary key,
  email text not null,
  expires_at text not null,
  consumed_at text
);

create table if not exists contacts (
  id text primary key,
  parent_id text not null references parents(id),
  role text not null,
  full_name text not null,
  first_name text not null,
  phone text not null,
  locale text not null default 'en',
  is_example boolean not null default false,
  email text,
  is_owner boolean not null default false,
  last_inbound_at text
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
  is_example boolean not null default false,
  mood text
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
  is_example boolean not null default false,
  provider_message_id text,
  delivery_status text,
  delivery_at text
);

create table if not exists webhook_events (
  id text primary key,
  source text not null,
  execution_id text,
  payload text not null,
  at text not null,
  processed boolean not null default false
);

create table if not exists family_config (
  parent_id text primary key references parents(id),
  retry_10 integer not null default 10,
  retry_25 integer not null default 25,
  soft_30 integer not null default 30,
  last_45 integer not null default 45,
  escalate_60 integer not null default 60,
  voice_alert_child boolean not null default false,
  is_example boolean not null default false
);

create table if not exists magic_links (
  token text primary key,
  parent_id text not null references parents(id),
  expires_at text not null,
  is_example boolean not null default false
);

create table if not exists deleted_events (
  id text primary key,
  at text not null,
  kind text not null
);

create table if not exists family_invites (
  token text primary key,
  parent_id text not null references parents(id),
  created_by text not null,
  expires_at text not null,
  consumed_at text,
  is_example boolean not null default false
);

create table if not exists audit_events (
  id text primary key,
  parent_id text not null references parents(id),
  who text not null,
  what text not null,
  at text not null,
  is_example boolean not null default false
);

create table if not exists push_subscriptions (
  id text primary key,
  parent_id text not null references parents(id),
  endpoint text not null,
  created_at text not null,
  is_example boolean not null default false
);

create table if not exists ops_flags (
  key text primary key,
  value text not null,
  updated_at text not null,
  updated_by text not null
);

create table if not exists ops_audit (
  id text primary key,
  who text not null,
  what text not null,
  at text not null
);

create table if not exists error_events (
  id text primary key,
  where_at text not null,
  message text not null,
  context text not null,
  at text not null
);
