-- Child sign-up: address term, session tokens, consent text version.
alter table parents add column if not exists address_term text;

create table if not exists auth_tokens (
  token text primary key,
  email text not null,
  expires_at text not null,
  consumed_at text
);
