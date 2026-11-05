-- Nothing in the app set whatsapp_opt_in before this, so every live send was blocked as not_opted_in.
-- Members typed their own WhatsApp number at setup or on the invite page; a neighbour said yes on WhatsApp.
update contacts set whatsapp_opt_in = true
 where role = 'child' and whatsapp_opted_out_at is null;

update contacts set whatsapp_opt_in = true
 where role = 'neighbour' and whatsapp_opted_out_at is null
   and parent_id in (select parent_id from consents where kind = 'neighbour_whatsapp' and granted = true);
