create table if not exists errands (
  id text primary key,
  parent_id text not null references parents(id),
  call_id text,
  kind text not null default 'refill',
  medicine_name text not null,
  quantity integer not null default 1,
  status text not null default 'open',
  partner_order_id text,
  desk_token text,
  delivery_day text,
  ordered_at text,
  out_for_delivery_at text,
  delivered_at text,
  told_parent_call_id text,
  created_at text not null,
  is_example boolean not null default false
);

create index if not exists errands_parent_status on errands (parent_id, status, created_at desc);

alter table if exists errands enable row level security;
