create table if not exists error_events (
  id text primary key,
  where_at text not null,
  message text not null,
  context text not null,
  at text not null
);

alter table if exists error_events enable row level security;
