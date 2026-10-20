/* Generated from src/lib/db/migrations/*.sql. Do not edit by hand. */
export const MIGRATION_SOURCES: { id: string; sql: string }[] = [
  {
    "id": "001_init",
    "sql": "-- Phase 1 schema. Applied by src/lib/db/client.ts on boot.\n-- Supabase: run this file in the SQL editor when SUPABASE_URL is set.\n\ncreate table if not exists parents (\n  id text primary key,\n  full_name text not null,\n  first_name text not null,\n  city text not null,\n  timezone text not null default 'Asia/Kolkata',\n  phone text not null,\n  languages text not null default 'hi,en',\n  call_time text not null,\n  paused boolean not null default false,\n  recording_consent boolean not null default false,\n  is_example boolean not null default false\n);\n\ncreate table if not exists contacts (\n  id text primary key,\n  parent_id text not null references parents(id),\n  role text not null,\n  full_name text not null,\n  first_name text not null,\n  phone text not null,\n  locale text not null default 'en',\n  is_example boolean not null default false\n);\n\ncreate table if not exists medicines (\n  id text primary key,\n  parent_id text not null references parents(id),\n  name text not null,\n  dose text not null,\n  appearance text not null,\n  meal text not null,\n  is_example boolean not null default false\n);\n\ncreate table if not exists schedules (\n  id text primary key,\n  medicine_id text not null references medicines(id),\n  time_local text not null,\n  is_example boolean not null default false\n);\n\ncreate table if not exists calls (\n  id text primary key,\n  parent_id text not null references parents(id),\n  started_at text not null,\n  ended_at text,\n  duration_sec integer,\n  status text not null,\n  summary_en text,\n  summary_hi text,\n  mood_quote text,\n  mood_quote_lang text,\n  transcript_json text,\n  recording_url text,\n  bolna_execution_id text,\n  is_example boolean not null default false\n);\n\ncreate table if not exists call_attempts (\n  id text primary key,\n  call_id text not null references calls(id),\n  attempted_at text not null,\n  offset_min integer not null,\n  result text not null,\n  is_example boolean not null default false\n);\n\ncreate table if not exists dose_logs (\n  id text primary key,\n  parent_id text not null references parents(id),\n  call_id text,\n  medicine_id text not null references medicines(id),\n  schedule_date text not null,\n  status text not null,\n  said text,\n  is_example boolean not null default false\n);\n\ncreate table if not exists alerts (\n  id text primary key,\n  parent_id text not null references parents(id),\n  call_id text,\n  category text not null,\n  level text not null,\n  quote text not null,\n  created_at text not null,\n  acked_at text,\n  acked_by text,\n  resolved_at text,\n  late boolean not null default false,\n  source text not null default 'mid_call',\n  is_example boolean not null default false\n);\n\ncreate table if not exists alert_events (\n  id text primary key,\n  alert_id text not null references alerts(id),\n  at text not null,\n  kind text not null,\n  actor text,\n  note text,\n  is_example boolean not null default false\n);\n\ncreate table if not exists memory_notes (\n  id text primary key,\n  parent_id text not null,\n  call_id text,\n  kind text not null,\n  note text not null,\n  is_example boolean not null default false\n);\n\ncreate table if not exists consents (\n  id text primary key,\n  parent_id text not null,\n  kind text not null,\n  granted boolean not null,\n  at text not null,\n  evidence text,\n  is_example boolean not null default false\n);\n\ncreate table if not exists outbound_messages (\n  id text primary key,\n  parent_id text not null,\n  channel text not null,\n  template text not null,\n  to_phone text not null,\n  body text not null,\n  at text not null,\n  status text not null,\n  is_example boolean not null default false\n);\n\ncreate table if not exists webhook_events (\n  id text primary key,\n  source text not null,\n  execution_id text,\n  payload text not null,\n  at text not null,\n  processed boolean not null default false\n);\n\ncreate table if not exists magic_links (\n  token text primary key,\n  parent_id text not null references parents(id),\n  expires_at text not null,\n  is_example boolean not null default false\n);\n"
  },
  {
    "id": "002_phase2",
    "sql": "create table if not exists tool_call_logs (\n  id text primary key,\n  call_sid text not null,\n  parent_id text not null,\n  tool text not null,\n  natural_key text not null,\n  payload text not null,\n  at text not null,\n  unique (call_sid, tool, natural_key)\n);\n\ncreate unique index if not exists alerts_call_category on alerts (call_id, category);\ncreate unique index if not exists dose_logs_call_med_day on dose_logs (call_id, medicine_id, schedule_date);\n"
  },
  {
    "id": "003_phase4",
    "sql": "create table if not exists family_config (\n  parent_id text primary key references parents(id),\n  retry_10 integer not null default 10,\n  retry_25 integer not null default 25,\n  soft_30 integer not null default 30,\n  last_45 integer not null default 45,\n  escalate_60 integer not null default 60,\n  voice_alert_child boolean not null default false,\n  is_example boolean not null default false\n);\n"
  },
  {
    "id": "004_mood",
    "sql": "alter table calls add column if not exists mood text;\n"
  },
  {
    "id": "005_contacts_email",
    "sql": "alter table contacts add column if not exists email text;\n"
  },
  {
    "id": "006_parent_consent",
    "sql": "alter table parents add column if not exists consent_status text not null default 'pending';\nalter table parents add column if not exists consent_at text;\n\n-- Existing EXAMPLE rows already had a spoken haan in consents; don't leave them pending.\nupdate parents\nset consent_status = 'given',\n    consent_at = c.at\nfrom consents c\nwhere c.parent_id = parents.id\n  and c.kind = 'parent_voice'\n  and c.granted = true\n  and parents.consent_status = 'pending';\n"
  },
  {
    "id": "007_deleted_events",
    "sql": "create table if not exists deleted_events (\n  id text primary key,\n  at text not null,\n  kind text not null\n);\n"
  },
  {
    "id": "008_consent_later",
    "sql": "alter table parents add column if not exists consent_later_count integer not null default 0;\n"
  },
  {
    "id": "009_signup",
    "sql": "-- Child sign-up: address term, session tokens, consent text version.\nalter table parents add column if not exists address_term text;\n\ncreate table if not exists auth_tokens (\n  token text primary key,\n  email text not null,\n  expires_at text not null,\n  consumed_at text\n);\n"
  },
  {
    "id": "010_audit",
    "sql": "create table if not exists audit_events (\n  id text primary key,\n  parent_id text not null references parents(id),\n  who text not null,\n  what text not null,\n  at text not null,\n  is_example boolean not null default false\n);\n"
  },
  {
    "id": "011_members",
    "sql": "alter table contacts add column if not exists is_owner boolean not null default false;\n\nupdate contacts set is_owner = true\nwhere role = 'child'\n  and id in (\n    select min(id) from contacts where role = 'child' group by parent_id\n  );\n\ncreate table if not exists family_invites (\n  token text primary key,\n  parent_id text not null references parents(id),\n  created_by text not null,\n  expires_at text not null,\n  consumed_at text,\n  is_example boolean not null default false\n);\n"
  },
  {
    "id": "012_push",
    "sql": "create table if not exists push_subscriptions (\n  id text primary key,\n  parent_id text not null references parents(id),\n  endpoint text not null,\n  created_at text not null,\n  is_example boolean not null default false\n);\n"
  },
  {
    "id": "013_rls",
    "sql": "-- Service role (our server) bypasses RLS. anon/public get no policies, so no rows.\nalter table if exists parents enable row level security;\nalter table if exists auth_tokens enable row level security;\nalter table if exists contacts enable row level security;\nalter table if exists medicines enable row level security;\nalter table if exists schedules enable row level security;\nalter table if exists calls enable row level security;\nalter table if exists call_attempts enable row level security;\nalter table if exists dose_logs enable row level security;\nalter table if exists alerts enable row level security;\nalter table if exists alert_events enable row level security;\nalter table if exists memory_notes enable row level security;\nalter table if exists consents enable row level security;\nalter table if exists outbound_messages enable row level security;\nalter table if exists webhook_events enable row level security;\nalter table if exists family_config enable row level security;\nalter table if exists magic_links enable row level security;\nalter table if exists deleted_events enable row level security;\nalter table if exists family_invites enable row level security;\nalter table if exists audit_events enable row level security;\nalter table if exists push_subscriptions enable row level security;\nalter table if exists schema_migrations enable row level security;\n"
  },
  {
    "id": "014_ops",
    "sql": "create table if not exists ops_flags (\n  key text primary key,\n  value text not null,\n  updated_at text not null,\n  updated_by text not null\n);\n\ncreate table if not exists ops_audit (\n  id text primary key,\n  who text not null,\n  what text not null,\n  at text not null\n);\n\nalter table if exists ops_flags enable row level security;\nalter table if exists ops_audit enable row level security;\n"
  },
  {
    "id": "015_errors",
    "sql": "create table if not exists error_events (\n  id text primary key,\n  where_at text not null,\n  message text not null,\n  context text not null,\n  at text not null\n);\n\nalter table if exists error_events enable row level security;\n"
  },
  {
    "id": "016_wa_session",
    "sql": "alter table contacts add column if not exists last_inbound_at text;\n"
  },
  {
    "id": "017_wa_delivery",
    "sql": "alter table outbound_messages add column if not exists provider_message_id text;\nalter table outbound_messages add column if not exists delivery_status text;\nalter table outbound_messages add column if not exists delivery_at text;\n"
  },
  {
    "id": "018_parent_call",
    "sql": "alter table calls add column if not exists parent_call_id text;\n"
  },
  {
    "id": "019_auth_codes",
    "sql": "-- 6-digit email sign-in codes. Hash always; plaintext only while MOCK_EMAIL=1 for /ops.\ncreate table if not exists auth_codes (\n  id text primary key,\n  email text not null,\n  code_hash text not null,\n  code_plain text,\n  expires_at text not null,\n  tries integer not null default 0,\n  consumed_at text,\n  created_at text not null\n);\n\nalter table if exists auth_codes enable row level security;\n"
  },
  {
    "id": "020_auth_code_issued_at",
    "sql": "alter table auth_codes add column if not exists issued_at bigint;\nupdate auth_codes set consumed_at = coalesce(consumed_at, created_at) where issued_at is null;\n"
  },
  {
    "id": "021_call_cost",
    "sql": "alter table calls add column if not exists total_cost numeric;\nalter table calls add column if not exists cost_breakdown text;\n"
  },
  {
    "id": "022_push_keys",
    "sql": "alter table push_subscriptions add column if not exists keys_json text;\n"
  }
];
