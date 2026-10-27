-- ============================================================
-- Migration 008: Researcher Role & Anonymized Prescriptions (Self-Contained)
-- ============================================================

-- 1. Ensure helper function exists
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2. Ensure public.file_assets table exists
create table if not exists public.file_assets (
  id            uuid primary key default gen_random_uuid(),
  bucket        text not null,
  storage_path  text not null,
  original_name text not null,
  mime_type     text not null,
  size          bigint not null,
  visibility    text not null default 'private' check (visibility in ('public', 'private')),
  uploaded_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.file_assets enable row level security;

-- 3. Extend profiles role constraint to include 'researcher'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'doctor', 'pharmacist', 'clinic_staff', 'patient', 'researcher'));

-- 4. Add columns to prescriptions table for anonymization
alter table public.prescriptions
  add column if not exists anonymized_file_asset_id uuid references public.file_assets(id) on delete set null,
  add column if not exists anonymized_status text not null default 'PENDING' check (anonymized_status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  add column if not exists anonymization_metadata jsonb not null default '{}';

-- 5. Update file_assets RLS to allow researchers access to anonymized files only
drop policy if exists "file_assets: private files staff readable" on public.file_assets;
create policy "file_assets: private files staff readable" on public.file_assets
  for select using (
    visibility = 'private' and (
      uploaded_by = auth.uid() or
      public.current_user_role() in ('admin', 'doctor', 'clinic_staff', 'pharmacist') or
      (public.current_user_role() = 'researcher' and exists (
        select 1 from public.prescriptions p where p.anonymized_file_asset_id = file_assets.id
      ))
    )
  );

-- 6. Allow researchers to view prescriptions table records
drop policy if exists "prescriptions: researcher read" on public.prescriptions;
create policy "prescriptions: researcher read" on public.prescriptions
  for select using (public.current_user_role() in ('admin', 'researcher'));
