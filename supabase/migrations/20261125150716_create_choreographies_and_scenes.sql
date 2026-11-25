-- Choreographies and scenes, constraints, RLS and the multi-row functions (see CLAUDE.md "Choreography rules").

create table public.choreographies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  stage_width_m numeric not null default 10,
  stage_depth_m numeric not null default 8,
  dancers jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint choreographies_title_length check (char_length(btrim(title)) between 1 and 100),
  constraint choreographies_stage_width check (stage_width_m between 1 and 50),
  constraint choreographies_stage_depth check (stage_depth_m between 1 and 50),
  -- case guards jsonb_array_length, which errors on non-arrays instead of failing the check
  constraint choreographies_dancers_array check (
    case when jsonb_typeof(dancers) = 'array' then jsonb_array_length(dancers) <= 30 else false end
  )
);

create index choreographies_owner_id_idx on public.choreographies (owner_id);

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  choreography_id uuid not null references public.choreographies (id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  name text not null,
  transition_seconds numeric not null default 4,
  positions jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenes_name_length check (char_length(btrim(name)) between 1 and 60),
  constraint scenes_transition_seconds check (transition_seconds between 0.5 and 60),
  constraint scenes_positions_object check (jsonb_typeof(positions) = 'object'),
  -- deferrable so one statement can renumber scenes without tripping over itself
  constraint scenes_order_key unique (choreography_id, sort_order) deferrable initially immediate
);

-- clock_timestamp, not now(), so several updates in one transaction still differ
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create trigger choreographies_set_updated_at before update on public.choreographies
  for each row execute function public.set_updated_at();
create trigger scenes_set_updated_at before update on public.scenes
  for each row execute function public.set_updated_at();

-- RLS: owners only; anon gets no grants and no policies
alter table public.choreographies enable row level security;
alter table public.scenes enable row level security;

create policy choreographies_owner on public.choreographies for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy scenes_owner on public.scenes for all to authenticated
  using (exists (
    select 1 from public.choreographies c
    where c.id = scenes.choreography_id and c.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.choreographies c
    where c.id = scenes.choreography_id and c.owner_id = (select auth.uid())
  ));

revoke all on public.choreographies, public.scenes from anon;
grant select, insert, update, delete on public.choreographies, public.scenes to authenticated;

-- Helper: keep every dancer but empty its waypoints.
create function public.clear_waypoints(p_positions jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_object_agg(e.k, jsonb_set(e.v, '{waypoints}', '[]')), '{}')
  from jsonb_each(p_positions) as e (k, v)
$$;

create function public.create_choreography(
  p_title text,
  p_stage_width_m numeric default 10,
  p_stage_depth_m numeric default 8
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  insert into public.choreographies (owner_id, title, stage_width_m, stage_depth_m)
  values ((select auth.uid()), btrim(p_title), p_stage_width_m, p_stage_depth_m)
  returning id into v_id;

  insert into public.scenes (choreography_id, sort_order, name) values (v_id, 0, 'Stseen 1');
  return v_id;
end;
$$;

-- p_scene_ids is the full new order. A scene keeps its waypoints only if its previous scene is unchanged.
create function public.reorder_scenes(p_choreography_id uuid, p_scene_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_total integer;
  v_matched integer;
begin
  select count(*), count(*) filter (where id = any (p_scene_ids))
    into v_total, v_matched
    from public.scenes where choreography_id = p_choreography_id;

  if v_total = 0 then
    raise exception 'choreography not found';
  end if;
  if v_total <> cardinality(p_scene_ids) or v_matched <> v_total then
    raise exception 'scene list does not match the choreography scenes';
  end if;

  set constraints public.scenes_order_key deferred;

  update public.scenes s
  set sort_order = n.ord - 1,
      positions = case
        when n.prev_id is null or n.prev_id is distinct from o.prev_id
          then public.clear_waypoints(s.positions)
        else s.positions
      end
  from (
    select id, lag(id) over (order by sort_order) as prev_id
    from public.scenes where choreography_id = p_choreography_id
  ) o
  join (
    select id, ord, lag(id) over (order by ord) as prev_id
    from unnest(p_scene_ids) with ordinality as t (id, ord)
  ) n on n.id = o.id
  where s.id = o.id;
end;
$$;

create function public.delete_scene(p_scene_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_choreography_id uuid;
  v_order integer;
begin
  select choreography_id, sort_order into v_choreography_id, v_order
    from public.scenes where id = p_scene_id;
  if not found then
    raise exception 'scene not found';
  end if;

  -- lock the parent so two concurrent deletes cannot both pass the last-scene check
  perform 1 from public.choreographies where id = v_choreography_id for update;
  if (select count(*) from public.scenes where choreography_id = v_choreography_id) = 1 then
    raise exception 'cannot delete the last scene';
  end if;

  set constraints public.scenes_order_key deferred;

  delete from public.scenes where id = p_scene_id;
  update public.scenes
  set sort_order = sort_order - 1,
      positions = case
        when sort_order = v_order + 1 then public.clear_waypoints(positions)
        else positions
      end
  where choreography_id = v_choreography_id and sort_order > v_order;
end;
$$;

-- p_dancer is { id, label, gender }; the caller picks the free grid slot (p_x, p_y).
create function public.add_dancer(
  p_choreography_id uuid,
  p_dancer jsonb,
  p_x double precision,
  p_y double precision
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_id text := p_dancer ->> 'id';
begin
  if v_id is null then
    raise exception 'dancer id missing';
  end if;

  update public.choreographies
  set dancers = dancers || jsonb_build_array(p_dancer)
  where id = p_choreography_id;
  if not found then
    raise exception 'choreography not found';
  end if;

  update public.scenes
  set positions = positions || jsonb_build_object(
    v_id, jsonb_build_object('x', p_x, 'y', p_y, 'waypoints', '[]'::jsonb)
  )
  where choreography_id = p_choreography_id;
end;
$$;

create function public.delete_dancer(p_choreography_id uuid, p_dancer_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.choreographies
  set dancers = coalesce((
    select jsonb_agg(t.d order by t.n)
    from jsonb_array_elements(dancers) with ordinality as t (d, n)
    where t.d ->> 'id' <> p_dancer_id::text
  ), '[]')
  where id = p_choreography_id;
  if not found then
    raise exception 'choreography not found';
  end if;

  update public.scenes
  set positions = positions - p_dancer_id::text
  where choreography_id = p_choreography_id;
end;
$$;

-- Functions are callable by signed-in users only; Supabase grants anon execute by default.
revoke all on function
  public.set_updated_at(),
  public.clear_waypoints(jsonb),
  public.create_choreography(text, numeric, numeric),
  public.reorder_scenes(uuid, uuid[]),
  public.delete_scene(uuid),
  public.add_dancer(uuid, jsonb, double precision, double precision),
  public.delete_dancer(uuid, uuid)
from public, anon;

grant execute on function
  public.clear_waypoints(jsonb),
  public.create_choreography(text, numeric, numeric),
  public.reorder_scenes(uuid, uuid[]),
  public.delete_scene(uuid),
  public.add_dancer(uuid, jsonb, double precision, double precision),
  public.delete_dancer(uuid, uuid)
to authenticated;
