create table if not exists family_config (
  parent_id text primary key references parents(id),
  retry_10 integer not null default 10,
  retry_25 integer not null default 25,
  soft_30 integer not null default 30,
  last_45 integer not null default 45,
  escalate_60 integer not null default 60,
  voice_alert_child boolean not null default false,
  is_example boolean not null default false
);
