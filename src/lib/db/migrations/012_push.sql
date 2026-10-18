create table if not exists push_subscriptions (
  id text primary key,
  parent_id text not null references parents(id),
  endpoint text not null,
  created_at text not null,
  is_example boolean not null default false
);
