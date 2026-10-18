create table if not exists audit_events (
  id text primary key,
  parent_id text not null references parents(id),
  who text not null,
  what text not null,
  at text not null,
  is_example boolean not null default false
);
