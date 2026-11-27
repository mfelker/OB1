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
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'thought_attachments_sensitivity_tier_check') then
    alter table thought_attachments add constraint thought_attachments_sensitivity_tier_check
      check (sensitivity_tier in ('standard', 'personal', 'restricted'));
  end if;
end $$;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'thought_attachments_state_check') then
    alter table thought_attachments add constraint thought_attachments_state_check
      check (state in ('pending_upload', 'processed', 'scanned', 'not_captioned', 'failed', 'refused'));
  end if;
end $$;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'thought_attachments_busy_op_check') then
    alter table thought_attachments add constraint thought_attachments_busy_op_check
      check (busy_op in ('finish', 'rebuild', 'remove'));
  end if;
end $$;

-- updated_at is maintained by a trigger.
create or replace function thought_attachments_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'thought_attachments_updated_at') then
    create trigger thought_attachments_updated_at
      before update on thought_attachments
      for each row execute function thought_attachments_touch();
  end if;
end $$;

create index if not exists thought_attachments_parent_idx on thought_attachments (parent_thought_id);
create index if not exists thought_attachments_content_hash_idx on thought_attachments (content_hash);

-- The same file on the same parent twice (FR-012).
create unique index if not exists thought_attachments_parent_hash_uniq
  on thought_attachments (parent_thought_id, content_hash)
  where state <> 'refused';

-- Access: RLS on, no policy for anon or authenticated.
alter table thought_attachments enable row level security;
grant select, insert, update, delete on thought_attachments to service_role;

-- The core's content fingerprint step (guide step 2.6), only where it is missing (R16).
alter table thoughts add column if not exists content_fingerprint text;
create unique index if not exists idx_thoughts_fingerprint
  on thoughts (content_fingerprint)
  where content_fingerprint is not null;

-- The private attachments bucket (R12), only where Supabase Storage exists. Named ob1-files, the
-- ATTACHMENTS_BUCKET default; an owner who sets another name creates that bucket the same way.
-- No size limit of its own: the platform's limit applies, so oversized files reach finishing.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    execute $q$
      insert into storage.buckets (id, name, public, allowed_mime_types)
      values ('ob1-files', 'ob1-files', false,
              array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
      on conflict do nothing
    $q$;
  end if;
end $$;

-- Lock the attachment row and require the caller's unexpired claim (R10).
create or replace function attachment_require_claim(p_id uuid, p_token text)
returns thought_attachments
language plpgsql
as $$
declare
  a thought_attachments;
begin
  select * into a from thought_attachments where id = p_id for update;
  if not found then
    raise exception 'attachment not found';
  end if;
  if a.busy_token is distinct from p_token or a.busy_until is null or a.busy_until <= now() then
    raise exception 'attachment claim not held';
  end if;
  return a;
end;
$$;

-- Apply a state patch: only the keys present in p_patch change (a present null clears the field).
create or replace function attachment_apply_patch(p_id uuid, p_patch jsonb)
returns thought_attachments
language plpgsql
as $$
declare
  a thought_attachments;
begin
  update thought_attachments t set
    state = case when p_patch ? 'state' then p_patch->>'state' else t.state end,
    state_reason = case when p_patch ? 'state_reason' then p_patch->>'state_reason' else t.state_reason end,
    last_rebuild_error = case when p_patch ? 'last_rebuild_error' then p_patch->>'last_rebuild_error' else t.last_rebuild_error end,
    caption_model = case when p_patch ? 'caption_model' then p_patch->>'caption_model' else t.caption_model end,
    derived_count = case when p_patch ? 'derived_count' then (p_patch->>'derived_count')::int else t.derived_count end,
    actual_type = case when p_patch ? 'actual_type' then p_patch->>'actual_type' else t.actual_type end,
    actual_size = case when p_patch ? 'actual_size' then (p_patch->>'actual_size')::bigint else t.actual_size end,
    page_count = case when p_patch ? 'page_count' then (p_patch->>'page_count')::int else t.page_count end,
    content_hash = case when p_patch ? 'content_hash' then p_patch->>'content_hash' else t.content_hash end,
    processed_at = case when p_patch ? 'processed_at' then (p_patch->>'processed_at')::timestamptz else t.processed_at end
  where t.id = p_id
  returning * into a;
  return a;
end;
$$;

-- Write the derived thoughts of one attachment (R9, R10): under the caller's claim, in one transaction.
-- p_rows is an array of { content, metadata, embedding } (a "[..]" vector text). p_patch holds the state
-- fields to set. A fingerprint conflict raises; nothing merges.
create or replace function attachment_write_derived(p_id uuid, p_token text, p_rows jsonb, p_patch jsonb)
returns thought_attachments
language plpgsql
as $$
declare
  r jsonb;
begin
  perform attachment_require_claim(p_id, p_token);
  delete from thoughts where metadata->>'attachment_id' = p_id::text;
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into thoughts (content, content_fingerprint, embedding, metadata)
    values (
      r->>'content',
      encode(sha256(convert_to(lower(trim(regexp_replace(r->>'content', '\s+', ' ', 'g'))), 'UTF8')), 'hex'),
      (r->>'embedding')::vector,
      coalesce(r->'metadata', '{}'::jsonb) || jsonb_build_object('attachment_id', p_id));
  end loop;
  return attachment_apply_patch(p_id, p_patch || jsonb_build_object('derived_count', jsonb_array_length(p_rows)));
end;
$$;
grant execute on function attachment_write_derived(uuid, text, jsonb, jsonb) to service_role;

-- Claim an attachment for one operation (FR-026, R10) with a single conditional update. Returns
-- { "token": ... } when taken, or { "busy": "<running op>" } while an unexpired claim exists.
create or replace function attachment_claim(p_id uuid, p_op text, p_seconds int)
returns jsonb
language plpgsql
as $$
declare
  tok text;
  running text;
begin
  update thought_attachments
    set busy_op = p_op,
        busy_until = now() + make_interval(secs => p_seconds),
        busy_token = gen_random_uuid()::text
    where id = p_id and (busy_until is null or busy_until <= now())
    returning busy_token into tok;
  if found then
    return jsonb_build_object('token', tok);
  end if;
  select busy_op into running from thought_attachments where id = p_id;
  if not found then
    raise exception 'attachment not found';
  end if;
  return jsonb_build_object('busy', running);
end;
$$;
grant execute on function attachment_claim(uuid, text, int) to service_role;
