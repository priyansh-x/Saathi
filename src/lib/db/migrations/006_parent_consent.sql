alter table parents add column if not exists consent_status text not null default 'pending';
alter table parents add column if not exists consent_at text;

-- Existing EXAMPLE rows already had a spoken haan in consents; don't leave them pending.
update parents
set consent_status = 'given',
    consent_at = c.at
from consents c
where c.parent_id = parents.id
  and c.kind = 'parent_voice'
  and c.granted = true
  and parents.consent_status = 'pending';
