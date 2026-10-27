alter table contacts add column if not exists whatsapp_opt_in boolean not null default false;
alter table contacts add column if not exists whatsapp_opted_out_at text;
