-- Keeps `npm run test:db` green until the RLS and constraint tests land.
begin;
select plan(1);
select has_schema('public');
select * from finish();
rollback;
