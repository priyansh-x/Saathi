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

alter table if exists ops_flags enable row level security;
alter table if exists ops_audit enable row level security;
