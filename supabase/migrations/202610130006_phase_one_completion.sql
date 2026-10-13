-- Phase 1: persist profile preferences and user-created event imagery.
alter table public.profiles
  add column if not exists personality_result jsonb not null default '{}'::jsonb;

alter table public.events
  add column if not exists image_url text;

drop view if exists public.event_catalog;
drop view if exists public.event_feed;

create view public.event_catalog as
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
  count(member.user_id) filter (where member.status = 'confirmed')::integer as attendee_count,
  (event.capacity - count(member.user_id) filter (where member.status = 'confirmed'))::integer as spots_remaining
from public.events as event
join public.profiles as host on host.id = event.host_id
left join public.event_members as member on member.event_id = event.id
where event.status = 'active' and event.starts_at > now()
group by event.id, host.display_name;

create view public.event_feed as
select * from public.event_catalog where spots_remaining > 0;

grant select on public.event_catalog to authenticated;
grant select on public.event_feed to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Event images are publicly readable"
on storage.objects for select to public
using (bucket_id = 'event-images');

create policy "Users can upload event images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update event images"
on storage.objects for update to authenticated
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete event images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
