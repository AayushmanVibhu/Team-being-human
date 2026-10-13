-- Tracks whether the member completed Kinlii's password setup flow.
-- Password hashes remain exclusively inside Supabase Auth.
alter table public.profiles
add column if not exists password_set boolean not null default false;
