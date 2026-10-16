-- Add ongoing weekly events. Run this migration before deploying the matching frontend.
alter table public.events
  add column if not exists recurrence_days integer[] not null default '{}';

alter table public.events
  drop constraint if exists events_recurrence_days_check;

alter table public.events
  add constraint events_recurrence_days_check check (
    cardinality(recurrence_days) <= 7
    and recurrence_days <@ array[0, 1, 2, 3, 4, 5, 6]
  );

drop view if exists public.event_feed;
drop view if exists public.event_catalog;

create view public.event_catalog
with (security_invoker = true)
as
select
  event.id,
  event.host_id,
  host.display_name as host_name,
  event.title,
  event.description,
  event.category,
  event.starts_at,
  event.ends_at,
  event.location_name,
  event.latitude,
  event.longitude,
  event.capacity,
  event.tags,
  event.image_url,
  event.recurrence_days,
  count(member.user_id) filter (where member.status = 'confirmed')::integer as attendee_count,
  (event.capacity - count(member.user_id) filter (where member.status = 'confirmed'))::integer as spots_remaining
from public.events as event
join public.profiles as host on host.id = event.host_id
left join public.event_members as member on member.event_id = event.id
where
  event.status = 'active'
  and (event.starts_at > now() or cardinality(event.recurrence_days) > 0)
group by event.id, host.display_name;

create view public.event_feed
with (security_invoker = true)
as
select * from public.event_catalog where spots_remaining > 0;

grant select on public.event_catalog to authenticated;
grant select on public.event_feed to authenticated;

drop function if exists public.create_event(text, text, text, timestamptz, text, integer, text[]);

create or replace function public.create_event(
  p_title text,
  p_description text,
  p_category text,
  p_starts_at timestamptz,
  p_location_name text,
  p_capacity integer,
  p_tags text[] default '{}',
  p_recurrence_days integer[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_event_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(btrim(p_title)) not between 3 and 100 then
    raise exception 'Event title must be between 3 and 100 characters';
  end if;
  if p_starts_at <= now() then
    raise exception 'Event must start in the future';
  end if;
  if p_capacity not between 2 and 12 then
    raise exception 'Capacity must be between 2 and 12';
  end if;
  if cardinality(coalesce(p_recurrence_days, '{}')) > 7
    or not (coalesce(p_recurrence_days, '{}') <@ array[0, 1, 2, 3, 4, 5, 6]) then
    raise exception 'Recurring days are invalid';
  end if;
  if not exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'Complete your profile before hosting an event';
  end if;

  insert into public.events (
    host_id,
    title,
    description,
    category,
    starts_at,
    location_name,
    capacity,
    status,
    tags,
    recurrence_days
  )
  values (
    current_user_id,
    btrim(p_title),
    coalesce(btrim(p_description), ''),
    btrim(p_category),
    p_starts_at,
    btrim(p_location_name),
    p_capacity,
    'active',
    coalesce(p_tags, '{}'),
    coalesce(p_recurrence_days, '{}')
  )
  returning id into new_event_id;

  insert into public.event_members (event_id, user_id, status)
  values (new_event_id, current_user_id, 'confirmed');

  return new_event_id;
end;
$$;

revoke all on function public.create_event(text, text, text, timestamptz, text, integer, text[], integer[])
from public, anon;
grant execute on function public.create_event(text, text, text, timestamptz, text, integer, text[], integer[])
to authenticated;

create or replace function public.join_event(p_event_id uuid)
returns table (event_id uuid, attendee_count integer, spots_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  event_capacity integer;
  confirmed_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'Complete your profile before joining an event';
  end if;

  select event.capacity into event_capacity
  from public.events as event
  where event.id = p_event_id
    and event.status = 'active'
    and (event.starts_at > now() or cardinality(event.recurrence_days) > 0)
  for update;

  if event_capacity is null then
    raise exception 'Event is unavailable';
  end if;

  if exists (
    select 1 from public.event_members as membership
    where membership.event_id = p_event_id
      and membership.user_id = current_user_id
      and membership.status = 'confirmed'
  ) then
    select count(*)::integer into confirmed_count
    from public.event_members as membership
    where membership.event_id = p_event_id and membership.status = 'confirmed';
    return query select p_event_id, confirmed_count, event_capacity - confirmed_count;
    return;
  end if;

  select count(*)::integer into confirmed_count
  from public.event_members as membership
  where membership.event_id = p_event_id and membership.status = 'confirmed';

  if confirmed_count >= event_capacity then
    raise exception 'Event is full';
  end if;

  insert into public.event_members as membership (event_id, user_id, status, joined_at, left_at)
  values (p_event_id, current_user_id, 'confirmed', now(), null)
  on conflict on constraint event_members_pkey do update
  set status = 'confirmed', joined_at = now(), left_at = null;

  confirmed_count := confirmed_count + 1;
  return query select p_event_id, confirmed_count, event_capacity - confirmed_count;
end;
$$;

revoke all on function public.join_event(uuid) from public, anon;
grant execute on function public.join_event(uuid) to authenticated;

-- Keep admin identity and aggregate metrics behind server-side checks.
create table if not exists public.app_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

insert into public.app_admins (email)
values ('anola293@asu.edu')
on conflict (email) do nothing;

alter table public.app_admins enable row level security;
revoke all on table public.app_admins from public, anon, authenticated;

create or replace function public.is_kinlii_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.app_admins as administrator
    join auth.users as account on lower(account.email) = administrator.email
    where account.id = auth.uid()
  );
$$;

revoke all on function public.is_kinlii_admin() from public, anon;
grant execute on function public.is_kinlii_admin() to authenticated;

create or replace function public.get_admin_metrics()
returns table (
  total_accounts integer,
  event_creators integer,
  event_joiners integer
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_kinlii_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select
    (select count(*)::integer from public.profiles),
    (select count(distinct event.host_id)::integer from public.events as event),
    (
      select count(distinct membership.user_id)::integer
      from public.event_members as membership
      join public.events as event on event.id = membership.event_id
      where membership.user_id <> event.host_id
        and membership.status in ('confirmed', 'left')
    );
end;
$$;

revoke all on function public.get_admin_metrics() from public, anon;
grant execute on function public.get_admin_metrics() to authenticated;
