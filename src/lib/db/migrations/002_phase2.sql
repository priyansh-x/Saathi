create table if not exists tool_call_logs (
  id text primary key,
  call_sid text not null,
  parent_id text not null,
  tool text not null,
  natural_key text not null,
  payload text not null,
  at text not null,
  unique (call_sid, tool, natural_key)
);

create unique index if not exists alerts_call_category on alerts (call_id, category);
create unique index if not exists dose_logs_call_med_day on dose_logs (call_id, medicine_id, schedule_date);
