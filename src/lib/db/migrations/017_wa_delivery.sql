alter table outbound_messages add column if not exists provider_message_id text;
alter table outbound_messages add column if not exists delivery_status text;
alter table outbound_messages add column if not exists delivery_at text;
