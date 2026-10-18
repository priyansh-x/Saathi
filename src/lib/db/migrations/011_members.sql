alter table contacts add column if not exists is_owner boolean not null default false;

update contacts set is_owner = true
where role = 'child'
  and id in (
    select min(id) from contacts where role = 'child' group by parent_id
  );

create table if not exists family_invites (
  token text primary key,
  parent_id text not null references parents(id),
  created_by text not null,
  expires_at text not null,
  consumed_at text,
  is_example boolean not null default false
);
