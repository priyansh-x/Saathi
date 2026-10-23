create table if not exists desk_views (
  id text primary key,
  parent_id text not null references parents(id),
  member_id text,
  at timestamptz not null
);

create index if not exists desk_views_parent_at on desk_views (parent_id, at desc);
