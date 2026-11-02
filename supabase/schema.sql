-- Fitness Coach App: database schema.
-- Run once in the Supabase SQL editor (safe to re-run).

create table if not exists public.availabilities (
  coach_id    uuid    not null references auth.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time  time    not null,
  end_time    time    not null,
  primary key (coach_id, day_of_week),
  check (start_time < end_time)
);

create table if not exists public.bookings (
  id           bigint generated always as identity primary key,
  coach_id     uuid        not null references auth.users(id) on delete cascade,
  client_name  text        not null,
  client_email text        not null,
  booking_time timestamptz not null,
  chat_history jsonb,
  created_at   timestamptz not null default now(),
  unique (coach_id, booking_time) -- prevents double-booking a slot
);

alter table public.availabilities enable row level security;
alter table public.bookings       enable row level security;

-- Availabilities: anyone can read (the public booking page needs it); coaches manage their own.
drop policy if exists "public read availability" on public.availabilities;
create policy "public read availability" on public.availabilities for select using (true);
drop policy if exists "coach manages availability" on public.availabilities;
create policy "coach manages availability" on public.availabilities for all
  using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- Bookings: anyone can create one; only the coach can read/manage theirs.
drop policy if exists "public create booking" on public.bookings;
create policy "public create booking" on public.bookings for insert with check (true);
drop policy if exists "coach reads bookings" on public.bookings;
create policy "coach reads bookings" on public.bookings for select using (auth.uid() = coach_id);
drop policy if exists "coach manages bookings" on public.bookings;
create policy "coach manages bookings" on public.bookings for delete using (auth.uid() = coach_id);

-- Lets the public booking page see which slots are taken WITHOUT exposing
-- client names, emails or intake chats.
create or replace function public.get_booked_times(p_coach_id uuid)
returns table (booking_time timestamptz)
language sql stable security definer set search_path = public as $$
  select b.booking_time from public.bookings b
  where b.coach_id = p_coach_id and b.booking_time > now();
$$;
grant execute on function public.get_booked_times(uuid) to anon, authenticated;
