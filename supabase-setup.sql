-- ============================================================
-- RT LAB — Supabase schema for multi-user cloud sync
-- Run this once in Supabase → SQL Editor
-- ============================================================

-- 1) Unified records table
create table if not exists public.lab_records (
  collection text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  ts         bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists lab_records_collection_idx on public.lab_records (collection);
create index if not exists lab_records_ts_idx on public.lab_records (collection, ts desc);

-- 2) Staff roles (maps auth.users email → role)
create table if not exists public.staff_roles (
  email        text primary key,
  role         text not null check (role in ('ceo','manager','chemist','rtlab')),
  display_name text
);

-- 3) Enable Realtime
alter publication supabase_realtime add table public.lab_records;

-- 4) RLS
alter table public.lab_records enable row level security;
alter table public.staff_roles enable row level security;

-- Helper: current role from staff_roles
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.staff_roles
  where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

-- Staff roles: staff can read own row; only service role manages writes (via SQL Editor)
drop policy if exists staff_roles_select on public.staff_roles;
create policy staff_roles_select on public.staff_roles
  for select using (true);

-- lab_records policies
-- Patients (anon / no session): INSERT new bookings only
drop policy if exists lab_records_patient_insert on public.lab_records;
create policy lab_records_patient_insert on public.lab_records
  for insert
  with check (
    collection = 'bookings'
    and auth.uid() is null
  );

-- Authenticated staff: full access to collections their role allows
drop policy if exists lab_records_staff_all on public.lab_records;
create policy lab_records_staff_all on public.lab_records
  for all
  using (
    public.current_staff_role() is not null
  )
  with check (
    public.current_staff_role() is not null
  );

-- Optional: allow anon SELECT of settings (lab name, whatsapp) for patient UI
drop policy if exists lab_records_public_settings_read on public.lab_records;
create policy lab_records_public_settings_read on public.lab_records
  for select
  using (collection = 'settings');

-- 5) Seed a CEO account example (replace email after creating the Auth user)
-- insert into public.staff_roles(email, role, display_name)
-- values ('ceo@rt-lab.app', 'ceo', 'المدير')
-- on conflict (email) do update set role = excluded.role;
