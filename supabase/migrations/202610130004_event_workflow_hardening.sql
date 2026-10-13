-- Makes event publication atomic and declares the authenticated role's privileges explicitly.
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_members to authenticated;
grant select, insert on public.event_leave_records to authenticated;
grant select, insert, delete on public.saved_events to authenticated;
grant select on public.profiles to authenticated;
grant select on public.event_feed to authenticated;

create or replace function public.create_event(
  p_title text,
  p_description text,
  p_category text,
  p_starts_at timestamptz,
  p_location_name text,
  p_capacity integer,
  p_tags text[] default '{}'
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
    tags
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
    coalesce(p_tags, '{}')
  )
  returning id into new_event_id;

  insert into public.event_members (event_id, user_id, status)
  values (new_event_id, current_user_id, 'confirmed');

  return new_event_id;
end;
$$;

revoke all on function public.create_event(text, text, text, timestamptz, text, integer, text[])
from public, anon;
grant execute on function public.create_event(text, text, text, timestamptz, text, integer, text[])
to authenticated;

grant execute on function public.join_event(uuid) to authenticated;
grant execute on function public.leave_event(uuid, text) to authenticated;
