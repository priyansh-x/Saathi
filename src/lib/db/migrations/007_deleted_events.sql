create table if not exists deleted_events (
  id text primary key,
  at text not null,
  kind text not null
);
