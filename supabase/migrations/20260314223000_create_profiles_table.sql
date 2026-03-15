create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  username text not null unique,
  dob date not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$')
);

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
