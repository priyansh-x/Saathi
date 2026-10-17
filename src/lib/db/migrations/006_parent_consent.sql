alter table parents add column if not exists consent_status text not null default 'pending';
alter table parents add column if not exists consent_at text;
