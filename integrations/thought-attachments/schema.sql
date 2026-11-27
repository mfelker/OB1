-- Thought attachments (spec 007): files linked to thoughts.
-- Additive and idempotent: safe to run more than once. Run after the core Open Brain schema.

create table if not exists thought_attachments (
  id uuid primary key default gen_random_uuid(),
  parent_thought_id uuid not null,
  parent_created_here boolean not null default false,
  file_name text,
  declared_type text,
  declared_size bigint,
  expected_kind text,
  actual_type text,
  actual_size bigint,
  page_count integer,
  content_hash text,
  storage_path text,
  sensitivity_tier text not null default 'personal',
  state text not null,
  state_reason text,
  last_rebuild_error text,
  caption_model text,
  derived_count integer not null default 0,
  upload_deadline timestamptz not null,
  page_token_hash text,
  busy_op text,
  busy_until timestamptz,
  busy_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  processed_at timestamptz
);

-- Value rules (added by name so a rerun never fails).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'thought_attachments_declared_type_check') then
    alter table thought_attachments add constraint thought_attachments_declared_type_check
      check (declared_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp'));
  end if;
end $$;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'thought_attachments_expected_kind_check') then
    alter table thought_attachments add constraint thought_attachments_expected_kind_check
      check (expected_kind in ('photo', 'pdf', ''));
  end if;
end $$;
