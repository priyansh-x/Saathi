-- 6-digit email sign-in codes. Hash always; plaintext only while MOCK_EMAIL=1 for /ops.
create table if not exists auth_codes (
  id text primary key,
  email text not null,
  code_hash text not null,
  code_plain text,
  expires_at text not null,
  tries integer not null default 0,
  consumed_at text,
  created_at text not null
);

alter table if exists auth_codes enable row level security;
