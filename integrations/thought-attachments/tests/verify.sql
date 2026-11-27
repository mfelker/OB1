-- Verification for integrations/thought-attachments/schema.sql (spec 007).
-- Runs on a throwaway Postgres with pgvector after .fork/ci/sql/bootstrap.sql.
-- Each block names its behavior id in its exception message. Safe to run twice.
\set ON_ERROR_STOP on

-- A verify-only stub of the Supabase storage schema lives as storage_verify_stub between runs,
-- so the no-storage path (U50) is exercised first on every run.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage')
     and obj_description((select oid from pg_namespace where nspname = 'storage'), 'pg_namespace') = 'ob1-007-verify-stub'
  then
    alter schema storage rename to storage_verify_stub;
  end if;
end $$;

select set_config('ob1.verify_real_storage', exists (select 1 from pg_namespace where nspname = 'storage')::text, false) as real_storage \gset

\i schema.sql

-- U50: where no storage schema exists, schema.sql ran without error above and made no bucket or storage schema
do $$
begin
  if current_setting('ob1.verify_real_storage') = 'true' then
    return; -- a real Supabase storage schema: this path is not testable here
  end if;
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    raise exception 'U50: a storage schema exists after the no-storage run';
  end if;
end $$;

-- U34: every column of thought_attachments, with type, default and not-null rule; no foreign key on parent_thought_id
do $$
declare
  want text[] := array[
    'id|uuid|NO|gen_random_uuid()', 'parent_thought_id|uuid|NO|', 'parent_created_here|boolean|NO|false',
    'file_name|text|YES|', 'declared_type|text|YES|', 'declared_size|bigint|YES|', 'expected_kind|text|YES|',
    'actual_type|text|YES|', 'actual_size|bigint|YES|', 'page_count|integer|YES|', 'content_hash|text|YES|',
    'storage_path|text|YES|', 'sensitivity_tier|text|NO|''personal''::text', 'state|text|NO|',
    'state_reason|text|YES|', 'last_rebuild_error|text|YES|', 'caption_model|text|YES|',
    'derived_count|integer|NO|0', 'upload_deadline|timestamp with time zone|NO|',
    'page_token_hash|text|YES|', 'busy_op|text|YES|', 'busy_until|timestamp with time zone|YES|',
    'busy_token|text|YES|', 'created_at|timestamp with time zone|YES|now()',
    'updated_at|timestamp with time zone|YES|now()', 'processed_at|timestamp with time zone|YES|'];
  have text[];
begin
  select array_agg(column_name || '|' || data_type || '|' || is_nullable || '|' || coalesce(column_default, '') order by column_name)
    into have from information_schema.columns where table_schema = 'public' and table_name = 'thought_attachments';
  if have is distinct from (select array_agg(w order by split_part(w, '|', 1)) from unnest(want) w) then
    raise exception 'U34: columns differ: %', have;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.thought_attachments'::regclass and contype = 'p') then
    raise exception 'U34: no primary key';
  end if;
  if exists (select 1 from pg_constraint where conrelid = 'public.thought_attachments'::regclass and contype = 'f') then
    raise exception 'U34: unexpected foreign key';
  end if;
end $$;

-- U35: declared_type accepts the four accepted types and rejects anything else
do $$
declare t text; v_id uuid;
begin
  foreach t in array array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] loop
    insert into thought_attachments (parent_thought_id, declared_type, state, upload_deadline)
      values (gen_random_uuid(), t, 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
  end loop;
  begin
    insert into thought_attachments (parent_thought_id, declared_type, state, upload_deadline)
      values (gen_random_uuid(), 'image/gif', 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
    raise exception 'U35: image/gif was accepted';
  exception when check_violation then null;
  end;
end $$;

-- U36: expected_kind accepts photo, pdf and empty and rejects any other value
do $$
declare t text; v_id uuid;
begin
  foreach t in array array['photo', 'pdf', ''] loop
    insert into thought_attachments (parent_thought_id, expected_kind, state, upload_deadline)
      values (gen_random_uuid(), t, 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
  end loop;
  begin
    insert into thought_attachments (parent_thought_id, expected_kind, state, upload_deadline)
      values (gen_random_uuid(), 'bogus', 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
    raise exception 'U36: bogus was accepted';
  exception when check_violation then null;
  end;
end $$;

-- U37: sensitivity_tier accepts the three tiers, defaults to personal and rejects any other value
do $$
declare t text; v_id uuid; d text;
begin
  foreach t in array array['standard', 'personal', 'restricted'] loop
    insert into thought_attachments (parent_thought_id, sensitivity_tier, state, upload_deadline)
      values (gen_random_uuid(), t, 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
  end loop;
  insert into thought_attachments (parent_thought_id, state, upload_deadline)
    values (gen_random_uuid(), 'pending_upload', now()) returning id, sensitivity_tier into v_id, d;
  delete from thought_attachments where id = v_id;
  if d <> 'personal' then raise exception 'U37: default tier is %', d; end if;
  begin
    insert into thought_attachments (parent_thought_id, sensitivity_tier, state, upload_deadline)
      values (gen_random_uuid(), 'secret', 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
    raise exception 'U37: secret was accepted';
  exception when check_violation then null;
  end;
end $$;

-- U38: state accepts the six states and rejects any other value
do $$
declare t text; v_id uuid;
begin
  foreach t in array array['pending_upload', 'processed', 'scanned', 'not_captioned', 'failed', 'refused'] loop
    insert into thought_attachments (parent_thought_id, state, upload_deadline)
      values (gen_random_uuid(), t, now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
  end loop;
  begin
    insert into thought_attachments (parent_thought_id, state, upload_deadline)
      values (gen_random_uuid(), 'done', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
    raise exception 'U38: done was accepted';
  exception when check_violation then null;
  end;
end $$;

-- U39: busy_op accepts finish, rebuild, remove and null, and rejects any other value
do $$
declare t text; v_id uuid;
begin
  foreach t in array array['finish', 'rebuild', 'remove'] loop
    insert into thought_attachments (parent_thought_id, busy_op, state, upload_deadline)
      values (gen_random_uuid(), t, 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
  end loop;
  begin
    insert into thought_attachments (parent_thought_id, busy_op, state, upload_deadline)
      values (gen_random_uuid(), 'purge', 'pending_upload', now()) returning id into v_id;
    delete from thought_attachments where id = v_id;
    raise exception 'U39: purge was accepted';
  exception when check_violation then null;
  end;
end $$;

-- U40: an update advances updated_at through the trigger
do $$
declare v_id uuid; before_ts timestamptz; after_ts timestamptz;
begin
  insert into thought_attachments (parent_thought_id, state, upload_deadline, updated_at)
    values (gen_random_uuid(), 'pending_upload', now(), now() - interval '1 day') returning id, updated_at into v_id, before_ts;
  update thought_attachments set state_reason = 'x' where id = v_id returning updated_at into after_ts;
  delete from thought_attachments where id = v_id;
  if after_ts <= before_ts then raise exception 'U40: updated_at did not advance (% then %)', before_ts, after_ts; end if;
end $$;

-- U41: indexes on parent_thought_id and on content_hash exist
do $$
begin
  if not exists (select 1 from pg_indexes where tablename = 'thought_attachments' and indexdef ~ '\(parent_thought_id\)$') then
    raise exception 'U41: no index on parent_thought_id';
  end if;
  if not exists (select 1 from pg_indexes where tablename = 'thought_attachments' and indexdef ~ '\(content_hash\)$') then
    raise exception 'U41: no index on content_hash';
  end if;
end $$;

-- U42: a second non-refused row with the same parent and content_hash is rejected
do $$
declare p uuid := gen_random_uuid(); a uuid; b uuid;
begin
  insert into thought_attachments (parent_thought_id, content_hash, state, upload_deadline)
    values (p, 'sha256:u42', 'processed', now()) returning id into a;
  begin
    insert into thought_attachments (parent_thought_id, content_hash, state, upload_deadline)
      values (p, 'sha256:u42', 'processed', now()) returning id into b;
    delete from thought_attachments where id = b;
    delete from thought_attachments where id = a;
    raise exception 'U42: duplicate (parent, hash) was accepted';
  exception when unique_violation then null;
  end;
  delete from thought_attachments where id = a;
end $$;

-- U43: a refused row with the same parent and content_hash doesn't block a new row
do $$
declare p uuid := gen_random_uuid(); a uuid; b uuid;
begin
  insert into thought_attachments (parent_thought_id, content_hash, state, upload_deadline)
    values (p, 'sha256:u43', 'refused', now()) returning id into a;
  insert into thought_attachments (parent_thought_id, content_hash, state, upload_deadline)
    values (p, 'sha256:u43', 'processed', now()) returning id into b;
  delete from thought_attachments where id = a;
  delete from thought_attachments where id = b;
end $$;

-- U44: two rows on the same parent with no content_hash yet are both allowed
do $$
declare p uuid := gen_random_uuid(); a uuid; b uuid;
begin
  insert into thought_attachments (parent_thought_id, state, upload_deadline) values (p, 'pending_upload', now()) returning id into a;
  insert into thought_attachments (parent_thought_id, state, upload_deadline) values (p, 'pending_upload', now()) returning id into b;
  delete from thought_attachments where id = a;
  delete from thought_attachments where id = b;
end $$;

-- U45: RLS is enabled with no policy for anon or authenticated
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.thought_attachments'::regclass) then
    raise exception 'U45: RLS is not enabled';
  end if;
  if exists (select 1 from pg_policies where tablename = 'thought_attachments' and (roles && array['anon', 'authenticated', 'public']::name[])) then
    raise exception 'U45: a policy exists for anon, authenticated or public';
  end if;
end $$;

-- U46: service_role has select, insert, update and delete on thought_attachments
do $$
declare p text;
begin
  foreach p in array array['select', 'insert', 'update', 'delete'] loop
    if not has_table_privilege('service_role', 'public.thought_attachments', p) then
      raise exception 'U46: service_role lacks %', p;
    end if;
  end loop;
end $$;

-- U47: the fingerprint column and idx_thoughts_fingerprint are added on a thoughts table without them.
-- fork-ci's bootstrap creates thoughts without the column, so the first run on a database exercises the add;
-- later runs find them present (U48 covers that case). verify.sql has no DROP to undo it.
do $$
declare has_col boolean; has_idx boolean;
begin
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'thoughts' and column_name = 'content_fingerprint') into has_col;
  select exists (select 1 from pg_indexes where tablename = 'thoughts' and indexname = 'idx_thoughts_fingerprint') into has_idx;
  if not has_col then raise exception 'U47: thoughts.content_fingerprint missing'; end if;
  if not has_idx then raise exception 'U47: idx_thoughts_fingerprint missing'; end if;
end $$;

-- U48: where the column and index exist, the file adds no second column or index
-- (a second run of schema.sql leaves the index count on thoughts unchanged)
do $$
begin
  create temp table if not exists u48_counts (idx bigint, cols bigint);
  insert into u48_counts select (select count(*) from pg_indexes where tablename = 'thoughts'),
    (select count(*) from information_schema.columns where table_name = 'thoughts' and table_schema = 'public');
end $$;
\i schema.sql
do $$
declare before_idx bigint; before_cols bigint;
begin
  select idx, cols into before_idx, before_cols from u48_counts;
  if (select count(*) from pg_indexes where tablename = 'thoughts') <> before_idx then raise exception 'U48: index count on thoughts changed'; end if;
  if (select count(*) from information_schema.columns where table_name = 'thoughts' and table_schema = 'public') <> before_cols then raise exception 'U48: column count on thoughts changed'; end if;
  if (select count(*) from pg_indexes where tablename = 'thoughts' and indexdef ~ 'content_fingerprint') <> 1 then raise exception 'U48: more than one fingerprint index'; end if;
end $$;

-- U49: with a stub storage schema, the ob1-files bucket row exists, is private, allows exactly the four
-- accepted MIME types and sets no size limit of its own.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    if not exists (select 1 from pg_namespace where nspname = 'storage_verify_stub') then
      create schema storage_verify_stub;
      comment on schema storage_verify_stub is 'ob1-007-verify-stub';
      create table storage_verify_stub.buckets (
        id text primary key, name text not null unique, public boolean default false,
        file_size_limit bigint, allowed_mime_types text[]);
    end if;
    alter schema storage_verify_stub rename to storage;
  end if;
end $$;
\i schema.sql
do $$
declare b record;
begin
  select * into b from storage.buckets where id = 'ob1-files';
  if not found then raise exception 'U49: bucket ob1-files missing'; end if;
  if b.name <> 'ob1-files' then raise exception 'U49: bucket name is %', b.name; end if;
  if b.public is distinct from false then raise exception 'U49: bucket is public'; end if;
  if b.file_size_limit is not null then raise exception 'U49: bucket sets its own size limit %', b.file_size_limit; end if;
  if (select array_agg(m order by m) from unnest(b.allowed_mime_types) m)
     is distinct from array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] then
    raise exception 'U49: allowed types are %', b.allowed_mime_types;
  end if;
end $$;
-- put the stub back out of sight so U50's no-storage run is first next time
do $$
begin
  if obj_description((select oid from pg_namespace where nspname = 'storage'), 'pg_namespace') = 'ob1-007-verify-stub' then
    alter schema storage rename to storage_verify_stub;
  end if;
end $$;

-- U51: running the whole file twice more raises nothing and leaves one of each object
\i schema.sql
\i schema.sql
do $$
declare n bigint;
begin
  select count(*) into n from pg_trigger where tgrelid = 'public.thought_attachments'::regclass and not tgisinternal;
  if n <> 1 then raise exception 'U51: % triggers on thought_attachments', n; end if;
  select count(*) into n from pg_indexes where schemaname = 'public' and tablename = 'thought_attachments';
  if n <> 4 then raise exception 'U51: % indexes on thought_attachments (want 4: pk, parent, hash, unique pair)', n; end if;
  select count(*) into n from pg_constraint where conrelid = 'public.thought_attachments'::regclass and contype = 'c';
  if n <> 5 then raise exception 'U51: % check constraints (want 5)', n; end if;
  select count(*) into n from pg_proc where proname = 'thought_attachments_touch';
  if n <> 1 then raise exception 'U51: % touch functions', n; end if;
end $$;

-- Test helpers (temp, this session only)
create or replace function pg_temp.mk_parent(p_content text default null) returns uuid
language sql as $$
  insert into thoughts (content, embedding) values (coalesce(p_content, 'parent ' || gen_random_uuid()::text), array_fill(0, array[1536])::vector) returning id
$$;
-- an attachment on a parent, with a held claim (token 'tok', unexpired by default)
create or replace function pg_temp.mk_att(p_parent uuid, p_state text default 'pending_upload', p_until interval default interval '10 minutes') returns uuid
language sql as $$
  insert into thought_attachments (parent_thought_id, state, upload_deadline, busy_op, busy_token, busy_until)
  values (p_parent, p_state, now() + interval '1 hour', 'finish', 'tok', now() + p_until) returning id
$$;
create or replace function pg_temp.rows_json(variadic p_contents text[]) returns jsonb
language sql as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'content', c, 'fingerprint', 'ignored', 'metadata', jsonb_build_object('type', 'reference'),
    'embedding', array_fill(0, array[1536])::vector::text)), '[]'::jsonb) from unnest(p_contents) c
$$;

-- U53: the write-derived function, with the caller's unexpired claim token, inserts the given rows
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); n bigint; dc int;
begin
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u53 one ' || a, 'u53 two ' || a), '{"state":"processed"}'::jsonb);
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  select derived_count into dc from thought_attachments where id = a;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if n <> 2 then raise exception 'U53: % rows inserted, want 2', n; end if;
end $$;

-- U54: a matching token whose busy_until has passed is refused, and nothing is written
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'pending_upload', interval '-1 second'); n bigint; refused boolean := false;
begin
  begin
    perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u54 one ' || a), '{"state":"processed"}'::jsonb);
  exception when others then
    refused := sqlerrm like '%claim%';
  end;
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if not refused then raise exception 'U54: an expired claim was not refused'; end if;
  if n <> 0 then raise exception 'U54: % rows written', n; end if;
end $$;

-- U55: inserted rows' content_fingerprint equals the guide's step 2.6 expression applied to their content
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); bad bigint; n bigint;
begin
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json(E'  U55   Mixed CASE\ntext ' || a), '{}'::jsonb);
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  select count(*) into bad from thoughts
    where metadata->>'attachment_id' = a::text
      and content_fingerprint is distinct from encode(sha256(convert_to(lower(trim(regexp_replace(content, '\s+', ' ', 'g'))), 'UTF8')), 'hex');
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if n <> 1 then raise exception 'U55: % rows written, want 1', n; end if;
  if bad <> 0 then raise exception 'U55: % rows with a different fingerprint', bad; end if;
end $$;
