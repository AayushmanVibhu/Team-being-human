-- Avoid PL/pgSQL ambiguity between the RPC's output column names and
-- event_members column names when restoring a previous membership.
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
    and event.starts_at > now()
  for update;

  if event_capacity is null then
    raise exception 'Event is unavailable';
  end if;

  if exists (
    select 1
    from public.event_members as membership
    where membership.event_id = p_event_id
      and membership.user_id = current_user_id
      and membership.status = 'confirmed'
  ) then
    select count(*)::integer into confirmed_count
    from public.event_members as membership
    where membership.event_id = p_event_id
      and membership.status = 'confirmed';

    return query
    select p_event_id, confirmed_count, event_capacity - confirmed_count;
    return;
  end if;

  select count(*)::integer into confirmed_count
  from public.event_members as membership
  where membership.event_id = p_event_id
    and membership.status = 'confirmed';

  if confirmed_count >= event_capacity then
    raise exception 'Event is full';
  end if;

  insert into public.event_members as membership (
    event_id,
    user_id,
    status,
    joined_at,
    left_at
  )
  values (p_event_id, current_user_id, 'confirmed', now(), null)
  on conflict on constraint event_members_pkey do update
  set
    status = 'confirmed',
    joined_at = now(),
    left_at = null;

  confirmed_count := confirmed_count + 1;
  return query
  select p_event_id, confirmed_count, event_capacity - confirmed_count;
end;
$$;

revoke all on function public.join_event(uuid) from public, anon;
grant execute on function public.join_event(uuid) to authenticated;
