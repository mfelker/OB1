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

\i schema.sql

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
