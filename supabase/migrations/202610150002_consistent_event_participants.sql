-- Give every authenticated viewer the same confirmed-member totals while
-- preserving row-level security on the underlying membership table.

create or replace function public.confirmed_event_member_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.event_members as membership
  where membership.event_id = p_event_id
    and membership.status = 'confirmed';
$$;

revoke all on function public.confirmed_event_member_count(uuid) from public, anon;
grant execute on function public.confirmed_event_member_count(uuid) to authenticated;

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
  public.confirmed_event_member_count(event.id) as attendee_count,
  (
    event.capacity - public.confirmed_event_member_count(event.id)
  )::integer as spots_remaining
from public.events as event
join public.profiles as host on host.id = event.host_id
where
  event.status = 'active'
  and (event.starts_at > now() or cardinality(event.recurrence_days) > 0);

create view public.event_feed
with (security_invoker = true)
as
select *
from public.event_catalog
where spots_remaining > 0;

grant select on public.event_catalog to authenticated;
grant select on public.event_feed to authenticated;

create or replace function public.get_event_participants(p_event_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  is_host boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.events as event
    where event.id = p_event_id
      and event.status = 'active'
      and (event.starts_at > now() or cardinality(event.recurrence_days) > 0)
  ) then
    raise exception 'Event is unavailable';
  end if;

  return query
  select
    profile.id,
    coalesce(nullif(btrim(profile.display_name), ''), 'Kinlii member'),
    profile.avatar_url,
    event.host_id = profile.id
  from public.event_members as membership
  join public.profiles as profile on profile.id = membership.user_id
  join public.events as event on event.id = membership.event_id
  where membership.event_id = p_event_id
    and membership.status = 'confirmed'
  order by
    (event.host_id = profile.id) desc,
    membership.joined_at asc;
end;
$$;

revoke all on function public.get_event_participants(uuid) from public, anon;
grant execute on function public.get_event_participants(uuid) to authenticated;
