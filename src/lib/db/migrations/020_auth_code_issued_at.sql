alter table auth_codes add column if not exists issued_at bigint;
update auth_codes set consumed_at = coalesce(consumed_at, created_at) where issued_at is null;
