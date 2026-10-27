create table if not exists family_messages (
  id text primary key,
  parent_id text not null references parents(id),
  from_member_id text,
  from_name text not null,
  text text not null,
  created_at text not null,
  delivered_call_id text,
  delivered_at text,
  reply_to_family text,
  replied_at text,
  is_example boolean not null default false
);

create index if not exists family_messages_parent_pending
  on family_messages (parent_id, created_at)
  where delivered_at is null;
