-- ============================================================
-- Migration 001: Core Schema
-- Pharmacon — Prescription Digitisation Platform
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Profiles (extends auth.users) ───────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  role        text not null check (role in ('admin', 'doctor', 'pharmacist', 'clinic_staff', 'patient')),
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on user signup (optional — can also be done via API)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'User'),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Team Members ─────────────────────────────────────────────────────────
create table public.team_members (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text not null,
  responsibilities text,
  technical_focus text,
  avatar_url      text,
  display_order   int not null default 0,
  created_at      timestamptz not null default now()
);

-- ─── Project Pages ────────────────────────────────────────────────────────
create table public.project_pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  content    text,
  updated_at timestamptz not null default now()
);

-- ─── Project Milestones (Roadmap) ─────────────────────────────────────────
create table public.project_milestones (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  target_date  date,
  status       text not null default 'upcoming' check (status in ('upcoming', 'in_progress', 'completed', 'delayed')),
  created_at   timestamptz not null default now()
);

-- ─── File Assets ──────────────────────────────────────────────────────────
create table public.file_assets (
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

-- ─── Deliverables ─────────────────────────────────────────────────────────
create table public.deliverables (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  version       text not null,
  type          text not null check (type in ('planning', 'demo', 'final', 'report', 'other')),
  date          date not null,
  authors       text[] not null,
  description   text,
  file_asset_id uuid references public.file_assets(id) on delete set null,
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Medicines ────────────────────────────────────────────────────────────
create table public.medicines (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  generic_name      text,
  strength          text not null,
  dosage_form       text not null,
  sku               text unique,
  manufacturer      text,
  unit              text not null,
  pack_size         int not null default 1,
  reorder_threshold int not null default 0,
  price             numeric(10, 2),
  status            text not null default 'active' check (status in ('active', 'inactive')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── Inventory Batches ────────────────────────────────────────────────────
create table public.inventory_batches (
  id            uuid primary key default gen_random_uuid(),
  medicine_id   uuid not null references public.medicines(id) on delete cascade,
  quantity      int not null check (quantity >= 0),
  batch_number  text,
  expiry_date   date,
  supplier      text,
  cost_per_unit numeric(10, 2),
  created_at    timestamptz not null default now()
);

-- ─── Inventory Transactions ───────────────────────────────────────────────
create table public.inventory_transactions (
  id               uuid primary key default gen_random_uuid(),
  medicine_id      uuid not null references public.medicines(id),
  batch_id         uuid references public.inventory_batches(id),
  quantity_change  int not null,
  transaction_type text not null check (transaction_type in ('RESTOCK', 'DISPENSE', 'ADJUSTMENT', 'RETURN')),
  actor_user_id    uuid references public.profiles(id) on delete set null,
  reference_id     uuid,   -- e.g., prescription_id for dispense
  reason           text,
  notes            text,
  created_at       timestamptz not null default now()
);

-- ─── Prescriptions ────────────────────────────────────────────────────────
create table public.prescriptions (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid references public.profiles(id) on delete set null,
  doctor_id     uuid references public.profiles(id) on delete set null,
  uploader_id   uuid references public.profiles(id) on delete set null,
  file_asset_id uuid references public.file_assets(id) on delete set null,
  status        text not null default 'UPLOADED' check (status in (
    'UPLOADED','PROCESSING','EXTRACTED','NEEDS_REVIEW',
    'CORRECTED','PENDING_DOCTOR_CONFIRMATION','CONFIRMED',
    'DISPENSING','DISPENSED','CANCELLED','REJECTED'
  )),
  ai_job_id     text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Prescription Extraction Fields ───────────────────────────────────────
create table public.prescription_extraction_fields (
  id                uuid primary key default gen_random_uuid(),
  prescription_id   uuid not null references public.prescriptions(id) on delete cascade,
  field_name        text not null,
  extracted_value   text,
  corrected_value   text,
  confidence        numeric(4, 3) check (confidence >= 0 and confidence <= 1),
  is_corrected      boolean not null default false,
  needs_review      boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ─── Prescription Corrections ─────────────────────────────────────────────
create table public.prescription_corrections (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  field_name      text not null,
  original_value  text,
  corrected_value text not null,
  corrected_by    uuid references public.profiles(id) on delete set null,
  reason          text,
  created_at      timestamptz not null default now()
);

-- ─── Prescription Status History ──────────────────────────────────────────
create table public.prescription_status_history (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  status          text not null,
  actor_id        uuid references public.profiles(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ─── Refill Requests ──────────────────────────────────────────────────────
create table public.refill_requests (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.profiles(id) on delete cascade,
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  status          text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','DISPENSED')),
  reviewed_by     uuid references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ─── Doctor Calibration Profiles ──────────────────────────────────────────
create table public.doctor_calibration_profiles (
  id                   uuid primary key default gen_random_uuid(),
  doctor_id            uuid not null unique references public.profiles(id) on delete cascade,
  status               text not null default 'COLLECTING_SAMPLES' check (status in ('COLLECTING_SAMPLES','READY_FOR_TRAINING','TRAINED','INSUFFICIENT_DATA')),
  sample_count         int not null default 0,
  last_calibrated_at   timestamptz,
  calibration_quality  numeric(4, 3),
  model_version        text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── Doctor Calibration Samples ───────────────────────────────────────────
create table public.doctor_calibration_samples (
  id                    uuid primary key default gen_random_uuid(),
  doctor_id             uuid not null references public.profiles(id) on delete cascade,
  file_asset_id         uuid references public.file_assets(id) on delete set null,
  labelled_transcription text not null,
  used_for_training     boolean not null default false,
  quality_status        text not null default 'PENDING' check (quality_status in ('PENDING','APPROVED','REJECTED')),
  created_at            timestamptz not null default now()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────
create table public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references public.profiles(id) on delete set null,
  action         text not null,
  entity_type    text not null,
  entity_id      uuid,
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

-- ─── Helper RPC: get_low_stock_medicines ──────────────────────────────────
create or replace function public.get_low_stock_medicines()
returns table (
  medicine_id   uuid,
  name          text,
  generic_name  text,
  strength      text,
  dosage_form   text,
  reorder_threshold int,
  total_stock   bigint
) language sql security definer as $$
  select
    m.id as medicine_id,
    m.name,
    m.generic_name,
    m.strength,
    m.dosage_form,
    m.reorder_threshold,
    coalesce(sum(b.quantity), 0) as total_stock
  from public.medicines m
  left join public.inventory_batches b on b.medicine_id = m.id
  where m.status = 'active'
  group by m.id, m.name, m.generic_name, m.strength, m.dosage_form, m.reorder_threshold
  having coalesce(sum(b.quantity), 0) <= m.reorder_threshold;
$$;

-- ─── Helper RPC: increment_calibration_sample_count ───────────────────────
create or replace function public.increment_calibration_sample_count(p_doctor_id uuid)
returns void language sql security definer as $$
  update public.doctor_calibration_profiles
  set sample_count = sample_count + 1, updated_at = now()
  where doctor_id = p_doctor_id;
$$;
