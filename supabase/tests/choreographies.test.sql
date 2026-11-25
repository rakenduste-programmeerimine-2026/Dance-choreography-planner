-- pgTAP: RLS, CHECK constraints, updated_at and the multi-row functions for choreographies and scenes.
begin;
select plan(53);

-- Fixed ids keep the statements below readable.
-- user A: aaaaaaaa-0000-0000-0000-000000000001, user B: bbbbbbbb-0000-0000-0000-000000000001
-- dancers: ...0001 is D1, ...0002 is D2
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.invalid');

create function pg_temp.wp(p_name text) returns int language sql as $$
  select jsonb_array_length(positions -> '00000000-0000-0000-0000-000000000002' -> 'waypoints')
  from public.scenes
  where choreography_id = current_setting('t.a')::uuid and name = p_name
$$;

create function pg_temp.order_of() returns text[] language sql as $$
  select array_agg(name order by sort_order) from public.scenes
  where choreography_id = current_setting('t.a')::uuid
$$;

-- Gives every dancer in every scene of A's choreography one waypoint.
create function pg_temp.fill_waypoints() returns void language sql as $$
  update public.scenes
  set positions = (
    select jsonb_object_agg(e.k, jsonb_set(e.v, '{waypoints}', '[{"x":0.5,"y":0.5}]'))
    from jsonb_each(positions) as e (k, v)
  )
  where choreography_id = current_setting('t.a')::uuid
$$;

-- ---- user A creates data ----
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

do $$ begin
  perform set_config('t.a', public.create_choreography('  A dance  ')::text, true);
end $$;

select is(
  (select title from public.choreographies where id = current_setting('t.a')::uuid),
  'A dance', 'create_choreography trims the title');
select is(
  (select array_agg(name) from public.scenes where choreography_id = current_setting('t.a')::uuid),
  array['Stseen 1'], 'create_choreography adds the first scene');

insert into public.scenes (choreography_id, sort_order, name) values
  (current_setting('t.a')::uuid, 1, 'S2'),
  (current_setting('t.a')::uuid, 2, 'S3'),
  (current_setting('t.a')::uuid, 3, 'S4');
update public.scenes set name = 'S1' where name = 'Stseen 1';

-- ---- user B cannot reach A's data ----
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*) from public.choreographies)::int, 0, 'B sees no choreographies of A');
select is((select count(*) from public.scenes)::int, 0, 'B sees no scenes of A');
select is_empty($$update public.choreographies set title = 'x' returning 1$$, 'B cannot update A choreography');
select is_empty($$delete from public.choreographies returning 1$$, 'B cannot delete A choreography');
select is_empty($$update public.scenes set name = 'x' returning 1$$, 'B cannot update A scenes');
select is_empty($$delete from public.scenes returning 1$$, 'B cannot delete A scenes');
select throws_ok(
  $$insert into public.scenes (choreography_id, sort_order, name)
    values (current_setting('t.a')::uuid, 9, 'x')$$,
  '42501', null, 'B cannot add a scene to A choreography');
select throws_ok(
  $$insert into public.choreographies (owner_id, title)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'x')$$,
  '42501', null, 'B cannot create a choreography owned by A');
select throws_ok(
  $$select public.reorder_scenes(current_setting('t.a')::uuid, array[gen_random_uuid()])$$,
  'P0001', 'choreography not found', 'B cannot reorder A scenes');
select throws_ok(
  $$select public.add_dancer(current_setting('t.a')::uuid,
    '{"id":"00000000-0000-0000-0000-000000000009"}', 0.1, 0.1)$$,
  'P0001', 'choreography not found', 'B cannot add a dancer to A choreography');
select throws_ok(
  $$select public.delete_dancer(current_setting('t.a')::uuid, '00000000-0000-0000-0000-000000000001')$$,
  'P0001', 'choreography not found', 'B cannot delete a dancer of A choreography');
select throws_ok(
  $$select public.delete_scene((select id from public.scenes limit 1))$$,
  'P0001', 'scene not found', 'B cannot delete an A scene');

-- ---- anon sees nothing ----
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$select * from public.choreographies$$, '42501', null, 'anon cannot read choreographies');
select throws_ok($$select * from public.scenes$$, '42501', null, 'anon cannot read scenes');
select throws_ok($$select public.create_choreography('x')$$, '42501', null, 'anon cannot call create_choreography');
select throws_ok(
  $$select public.reorder_scenes(gen_random_uuid(), array[]::uuid[])$$,
  '42501', null, 'anon cannot call reorder_scenes');

-- ---- CHECK constraints, as A ----
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select throws_ok($$insert into public.choreographies (owner_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', '   ')$$,
  '23514', null, 'blank title is rejected');
select throws_ok($$insert into public.choreographies (owner_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', repeat('x', 101))$$,
  '23514', null, 'title over 100 characters is rejected');
select throws_ok($$insert into public.choreographies (owner_id, title, stage_width_m) values ('aaaaaaaa-0000-0000-0000-000000000001', 't', 51)$$,
  '23514', null, 'stage width over 50 is rejected');
select throws_ok($$insert into public.choreographies (owner_id, title, stage_depth_m) values ('aaaaaaaa-0000-0000-0000-000000000001', 't', 0.5)$$,
  '23514', null, 'stage depth under 1 is rejected');
select throws_ok($$insert into public.choreographies (owner_id, title, dancers) values ('aaaaaaaa-0000-0000-0000-000000000001', 't', '{}')$$,
  '23514', null, 'dancers that are not an array are rejected');
select throws_ok($$insert into public.choreographies (owner_id, title, dancers) values ('aaaaaaaa-0000-0000-0000-000000000001', 't', (select jsonb_agg(i) from generate_series(1, 31) i))$$,
  '23514', null, '31 dancers are rejected');
select throws_ok($$insert into public.scenes (choreography_id, sort_order, name, transition_seconds) values (current_setting('t.a')::uuid, 9, 'x', 0.4)$$,
  '23514', null, 'transition under 0.5 is rejected');
select throws_ok($$insert into public.scenes (choreography_id, sort_order, name, transition_seconds) values (current_setting('t.a')::uuid, 9, 'x', 61)$$,
  '23514', null, 'transition over 60 is rejected');
select throws_ok($$insert into public.scenes (choreography_id, sort_order, name, positions) values (current_setting('t.a')::uuid, 9, 'x', '[]')$$,
  '23514', null, 'positions that are not an object are rejected');
select throws_ok($$insert into public.scenes (choreography_id, sort_order, name) values (current_setting('t.a')::uuid, 9, ' ')$$,
  '23514', null, 'blank scene name is rejected');
select throws_ok($$insert into public.scenes (choreography_id, sort_order, name) values (current_setting('t.a')::uuid, 9, repeat('x', 61))$$,
  '23514', null, 'scene name over 60 characters is rejected');
select throws_ok($$insert into public.scenes (choreography_id, sort_order, name) values (current_setting('t.a')::uuid, 0, 'dup')$$,
  '23505', null, 'duplicate sort_order is rejected');

reset role;
select is((select condeferrable from pg_constraint where conname = 'scenes_order_key'), true,
  'the sort_order constraint is deferrable');

-- ---- updated_at ----
do $$ begin
  perform set_config('t.c_old', (select updated_at::text from public.choreographies where id = current_setting('t.a')::uuid), true);
  perform set_config('t.s_old', (select updated_at::text from public.scenes where name = 'S2' and choreography_id = current_setting('t.a')::uuid), true);
  update public.choreographies set title = 'A dance 2' where id = current_setting('t.a')::uuid;
  update public.scenes set name = 'S2b' where name = 'S2' and choreography_id = current_setting('t.a')::uuid;
end $$;
select isnt((select updated_at::text from public.choreographies where id = current_setting('t.a')::uuid),
  current_setting('t.c_old'), 'choreography updated_at changes on update');
select isnt((select updated_at::text from public.scenes where name = 'S2b' and choreography_id = current_setting('t.a')::uuid),
  current_setting('t.s_old'), 'scene updated_at changes on update');
update public.scenes set name = 'S2' where name = 'S2b';

-- ---- dancers, as A ----
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select public.add_dancer(current_setting('t.a')::uuid,
  '{"id":"00000000-0000-0000-0000-000000000001","label":"1","gender":"naine"}', 0.1, 0.2) is not null as added_d1;
select public.add_dancer(current_setting('t.a')::uuid,
  '{"id":"00000000-0000-0000-0000-000000000002","label":"2","gender":"naine"}', 0.3, 0.2) is not null as added_d2;

select is((select jsonb_array_length(dancers) from public.choreographies where id = current_setting('t.a')::uuid), 2,
  'add_dancer appends to the choreography');
select is((select count(*)::int from public.scenes where choreography_id = current_setting('t.a')::uuid
  and positions ? '00000000-0000-0000-0000-000000000001'), 4, 'add_dancer adds the dancer to every scene');
select is((select positions -> '00000000-0000-0000-0000-000000000002' from public.scenes where name = 'S3'),
  '{"x":0.3,"y":0.2,"waypoints":[]}'::jsonb, 'add_dancer stores the same spot with no waypoints');

-- fill up to 30, then the 31st must fail and leave every scene untouched
do $$ begin
  for i in 3..30 loop
    perform public.add_dancer(current_setting('t.a')::uuid,
      jsonb_build_object('id', gen_random_uuid(), 'label', i::text, 'gender', 'naine'), 0.5, 0.5);
  end loop;
end $$;
select throws_ok(
  $$select public.add_dancer(current_setting('t.a')::uuid,
    '{"id":"00000000-0000-0000-0000-0000000000ff","label":"31","gender":"naine"}', 0.5, 0.5)$$,
  '23514', null, 'the 31st dancer is rejected');
select is((select count(*)::int from public.scenes where choreography_id = current_setting('t.a')::uuid
  and positions ? '00000000-0000-0000-0000-0000000000ff'), 0, 'a rejected add_dancer changes no scene');

select public.delete_dancer(current_setting('t.a')::uuid, '00000000-0000-0000-0000-000000000001') is not null as deleted_d1;
select is((select jsonb_array_length(dancers) from public.choreographies where id = current_setting('t.a')::uuid), 29,
  'delete_dancer removes the dancer from the choreography');
select is((select count(*)::int from public.scenes where choreography_id = current_setting('t.a')::uuid
  and positions ? '00000000-0000-0000-0000-000000000001'), 0, 'delete_dancer removes the dancer from every scene');

-- ---- reorder: S1 S2 S3 S4 -> S1 S2 S4 S3 ----
reset role;
select pg_temp.fill_waypoints();
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select public.reorder_scenes(current_setting('t.a')::uuid,
  (select array_agg(id order by array_position(array['S1','S2','S4','S3'], name))
   from public.scenes where choreography_id = current_setting('t.a')::uuid)) is not null as reordered;
set constraints all immediate;  -- fails here if sort_order is not unique
select is(pg_temp.order_of(), array['S1','S2','S4','S3'], 'reorder_scenes sets the new order');
select is((select array_agg(sort_order order by sort_order) from public.scenes
  where choreography_id = current_setting('t.a')::uuid), array[0,1,2,3], 'sort_order stays 0..n-1 and unique');
select is(pg_temp.wp('S2'), 1, 'reorder keeps waypoints when the previous scene is unchanged');
select is(pg_temp.wp('S4'), 0, 'reorder clears waypoints of a scene with a new previous scene');
select is(pg_temp.wp('S3'), 0, 'reorder clears waypoints of the other moved scene');
select is(pg_temp.wp('S1'), 0, 'reorder clears waypoints of the first scene');
select throws_ok(
  $$select public.reorder_scenes(current_setting('t.a')::uuid, array[gen_random_uuid()])$$,
  'P0001', 'scene list does not match the choreography scenes', 'reorder rejects a list that misses scenes');

-- ---- delete scene: S1 S2 S4 S3, delete S1 ----
reset role;
select pg_temp.fill_waypoints();
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select public.delete_scene((select id from public.scenes where name = 'S1'
  and choreography_id = current_setting('t.a')::uuid)) is not null as deleted_s1;
set constraints all immediate;
select is(pg_temp.order_of(), array['S2','S4','S3'], 'delete_scene removes the scene');
select is((select array_agg(sort_order order by sort_order) from public.scenes
  where choreography_id = current_setting('t.a')::uuid), array[0,1,2], 'delete_scene closes the sort_order gap');
select is(pg_temp.wp('S2'), 0, 'delete_scene clears waypoints of the next scene');
select is(pg_temp.wp('S4'), 1, 'delete_scene keeps waypoints of later scenes');

-- ---- last scene cannot be deleted ----
select public.delete_scene((select id from public.scenes where name = 'S2'
  and choreography_id = current_setting('t.a')::uuid)) is not null as deleted_s2;
select public.delete_scene((select id from public.scenes where name = 'S4'
  and choreography_id = current_setting('t.a')::uuid)) is not null as deleted_s4;
select throws_ok(
  $$select public.delete_scene((select id from public.scenes where choreography_id = current_setting('t.a')::uuid))$$,
  'P0001', 'cannot delete the last scene', 'the last scene cannot be deleted');
select is((select count(*)::int from public.scenes where choreography_id = current_setting('t.a')::uuid), 1,
  'one scene is left');

select * from finish();
rollback;
