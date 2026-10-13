-- Distinguishes first-time accounts from members who have completed onboarding.
alter table public.profiles
add column if not exists onboarding_completed boolean not null default false;
