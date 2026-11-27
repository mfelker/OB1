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
    -- A real Supabase storage schema: the no-storage path can't be run here, so say so instead of passing silently.
    raise notice 'U50: SKIPPED: a real storage schema exists, so the no-storage path was not run (it runs on fork-ci''s bootstrap)';
    return;
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
    'file_name|text|YES|', 'declared_type|text|YES|', 'declared_size|bigint|YES|', 'declared_by_page|boolean|NO|false', 'expected_kind|text|YES|',
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

-- U56: a row whose fingerprint equals an owner thought's raises, and that thought is unchanged
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); o uuid; txt text := 'U56 owner thought ' || gen_random_uuid(); raised boolean := false; c text; m jsonb;
begin
  insert into thoughts (content, content_fingerprint, metadata)
    values (txt, encode(sha256(convert_to(lower(trim(regexp_replace(txt, '\s+', ' ', 'g'))), 'UTF8')), 'hex'), '{"owner":true}') returning id into o;
  begin
    perform attachment_write_derived(a, 'tok', pg_temp.rows_json(txt), '{"state":"processed"}'::jsonb);
  exception when unique_violation then raised := true;
  end;
  select content, metadata into c, m from thoughts where id = o;
  delete from thoughts where id = o;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if not raised then raise exception 'U56: a fingerprint conflict did not raise'; end if;
  if c <> txt or m <> '{"owner":true}'::jsonb then raise exception 'U56: owner thought changed: % %', c, m; end if;
end $$;

-- U57: a write replaces the previous derived set and sets the state fields and derived_count together
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); n bigint; old_left bigint; r thought_attachments;
begin
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u57 old one ' || a, 'u57 old two ' || a), '{"state":"processed"}'::jsonb);
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u57 new ' || a),
    '{"state":"processed","caption_model":"vision-x","page_count":3,"content_hash":"sha256:u57","actual_type":"application/pdf","actual_size":10,"processed_at":"2026-01-02T03:04:05Z","state_reason":null}'::jsonb);
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  select count(*) into old_left from thoughts where metadata->>'attachment_id' = a::text and content like 'u57 old%';
  select * into r from thought_attachments where id = a;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if n <> 1 or old_left <> 0 then raise exception 'U57: set not replaced (% rows, % old)', n, old_left; end if;
  if r.derived_count <> 1 then raise exception 'U57: derived_count %', r.derived_count; end if;
  if r.state <> 'processed' or r.caption_model <> 'vision-x' or r.page_count <> 3 or r.content_hash <> 'sha256:u57'
     or r.actual_type <> 'application/pdf' or r.actual_size <> 10 or r.processed_at is null then
    raise exception 'U57: state fields not set: %', r;
  end if;
end $$;

-- U58: a write that fails partway (its second row conflicts) leaves the previous set, state and derived_count
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); o uuid; txt text := 'U58 owner ' || gen_random_uuid();
        raised boolean := false; old_n bigint; new_n bigint; st text; dc int;
begin
  insert into thoughts (content, content_fingerprint)
    values (txt, encode(sha256(convert_to(lower(trim(regexp_replace(txt, '\s+', ' ', 'g'))), 'UTF8')), 'hex')) returning id into o;
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u58 old one ' || a, 'u58 old two ' || a), '{"state":"processed"}'::jsonb);
  begin
    perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u58 new ' || a, txt), '{"state":"failed"}'::jsonb);
  exception when unique_violation then raised := true;
  end;
  select count(*) filter (where content like 'u58 old%'), count(*) filter (where content like 'u58 new%') into old_n, new_n
    from thoughts where metadata->>'attachment_id' = a::text;
  select state, derived_count into st, dc from thought_attachments where id = a;
  delete from thoughts where id = o;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if not raised then raise exception 'U58: the conflicting write did not raise'; end if;
  if old_n <> 2 or new_n <> 0 then raise exception 'U58: set changed (% old, % new)', old_n, new_n; end if;
  if st <> 'processed' or dc <> 2 then raise exception 'U58: state % derived_count %', st, dc; end if;
end $$;

-- U59: a write for one attachment leaves another attachment's derived thoughts untouched
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); p2 uuid := pg_temp.mk_parent(); b uuid := pg_temp.mk_att(p2); n bigint; dc int;
begin
  perform attachment_write_derived(b, 'tok', pg_temp.rows_json('u59 other ' || b), '{"state":"processed"}'::jsonb);
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u59 mine ' || a), '{"state":"processed"}'::jsonb);
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u59 mine again ' || a), '{"state":"processed"}'::jsonb);
  select count(*) into n from thoughts where metadata->>'attachment_id' = b::text and content = 'u59 other ' || b;
  select derived_count into dc from thought_attachments where id = b;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thoughts where metadata->>'attachment_id' = b::text;
  delete from thought_attachments where id = a;
  delete from thought_attachments where id = b;
  delete from thoughts where id = p;
  delete from thoughts where id = p2;
  if n <> 1 or dc <> 1 then raise exception 'U59: the other attachment changed (% rows, derived_count %)', n, dc; end if;
end $$;

-- U60: setting content_hash to one another non-refused attachment of the parent holds raises and changes nothing
do $$
declare p uuid := pg_temp.mk_parent(); a uuid; b uuid := pg_temp.mk_att(p); raised boolean := false; n bigint; h text; st text;
begin
  insert into thought_attachments (parent_thought_id, content_hash, state, upload_deadline)
    values (p, 'sha256:u60', 'processed', now()) returning id into a;
  begin
    perform attachment_write_derived(b, 'tok', pg_temp.rows_json('u60 ' || b), '{"state":"processed","content_hash":"sha256:u60"}'::jsonb);
  exception when unique_violation then raised := true;
  end;
  select count(*) into n from thoughts where metadata->>'attachment_id' = b::text;
  select content_hash, state into h, st from thought_attachments where id = b;
  delete from thought_attachments where id = a;
  delete from thought_attachments where id = b;
  delete from thoughts where id = p;
  if not raised then raise exception 'U60: the duplicate content_hash was accepted'; end if;
  if n <> 0 or h is not null or st <> 'pending_upload' then raise exception 'U60: changed (% rows, hash %, state %)', n, h, st; end if;
end $$;

-- U61: a claim while an unexpired claim exists is refused and returns the running busy_op
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); r jsonb; tok text;
begin
  r := attachment_claim(a, 'remove', 60);
  select busy_token into tok from thought_attachments where id = a;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if r is distinct from '{"busy": "finish"}'::jsonb then raise exception 'U61: claim returned %', r; end if;
  if tok <> 'tok' then raise exception 'U61: the holder''s token changed to %', tok; end if;
end $$;

-- U62: a claim after busy_until succeeds, with a busy_token different from the previous one
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'pending_upload', interval '-1 second'); r jsonb; row_ thought_attachments;
begin
  r := attachment_claim(a, 'rebuild', 60);
  select * into row_ from thought_attachments where id = a;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if r->>'token' is null or r->>'token' = 'tok' then raise exception 'U62: claim returned %', r; end if;
  if row_.busy_token is distinct from r->>'token' or row_.busy_op <> 'rebuild' or row_.busy_until <= now() then
    raise exception 'U62: claim not recorded: %', row_;
  end if;
end $$;

-- U63: a claim on one attachment doesn't block a claim on another
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'pending_upload', interval '-1 second'); b uuid := pg_temp.mk_att(p, 'pending_upload', interval '-1 second'); ra jsonb; rb jsonb; ta text; tb text;
begin
  ra := attachment_claim(a, 'finish', 60);
  rb := attachment_claim(b, 'finish', 60);
  select busy_token into ta from thought_attachments where id = a;
  select busy_token into tb from thought_attachments where id = b;
  delete from thought_attachments where id = a;
  delete from thought_attachments where id = b;
  delete from thoughts where id = p;
  if ra->>'token' is null or rb->>'token' is null then raise exception 'U63: claims were % and %', ra, rb; end if;
  if ta = tb or ta <> ra->>'token' or tb <> rb->>'token' then raise exception 'U63: tokens mixed up'; end if;
end $$;

-- U64: release with the holder's token clears the claim, so an immediate claim succeeds
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'pending_upload', interval '-1 second'); r jsonb; r2 jsonb;
begin
  r := attachment_claim(a, 'finish', 60);
  perform attachment_release(a, r->>'token');
  r2 := attachment_claim(a, 'remove', 60);
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if r2->>'token' is null then raise exception 'U64: claim after release returned %', r2; end if;
end $$;

-- U65: release with another token leaves the claim in place
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'pending_upload', interval '-1 second'); r jsonb; r2 jsonb;
begin
  r := attachment_claim(a, 'finish', 60);
  perform attachment_release(a, 'not-the-token');
  r2 := attachment_claim(a, 'remove', 60);
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if r2 is distinct from '{"busy": "finish"}'::jsonb then raise exception 'U65: the claim was released by another token: %', r2; end if;
end $$;

-- U66: the dimension function returns 1536 on fork-ci's bootstrap (vector(1536))
do $$
begin
  if attachment_embedding_dimension() is distinct from 1536 then
    raise exception 'U66: dimension is %', attachment_embedding_dimension();
  end if;
end $$;

-- U67: the exact-text find returns id, first line and capture date for a thought whose content contains the query
do $$
declare tag text := 'u67' || replace(gen_random_uuid()::text, '-', ''); t uuid; r record; n int := 0;
begin
  insert into thoughts (content) values (E'Line one ' || tag || E' middle\nsecond line') returning id into t;
  for r in select * from attachment_find_thoughts_exact(tag, 20) loop
    n := n + 1;
    if r.id <> t or r.first_line <> 'Line one ' || tag || ' middle' or r.captured is null then
      delete from thoughts where id = t;
      raise exception 'U67: unexpected match %', r;
    end if;
  end loop;
  delete from thoughts where id = t;
  if n <> 1 then raise exception 'U67: % matches', n; end if;
end $$;

-- U68: a query containing % , ) and ' matches only content that has those characters literally
do $$
declare tag text := 'u68' || replace(gen_random_uuid()::text, '-', ''); q text; lit uuid; wild uuid; n int; hit uuid;
begin
  q := tag || ' 50%, (a) it''s';
  insert into thoughts (content) values ('has ' || q || ' inside') returning id into lit;
  insert into thoughts (content) values ('has ' || tag || ' 50x, (a) it''s inside') returning id into wild;
  select count(*), min(id::text)::uuid into n, hit from attachment_find_thoughts_exact(q, 20);
  delete from thoughts where id = lit;
  delete from thoughts where id = wild;
  if n <> 1 or hit <> lit then raise exception 'U68: % matches, first %', n, hit; end if;
end $$;

-- U314: the exact-text find ignores letter case, and a thought without the text in any case is not returned
do $$
declare tag text := replace(gen_random_uuid()::text, '-', ''); yes uuid; no uuid; n int; hit uuid;
begin
  insert into thoughts (content) values ('Box of furnace filters ' || tag) returning id into yes;
  insert into thoughts (content) values ('Box of water filters ' || tag) returning id into no;
  select count(*), min(id::text)::uuid into n, hit from attachment_find_thoughts_exact('FURNACE Filters ' || upper(tag), 20);
  delete from thoughts where id = yes;
  delete from thoughts where id = no;
  if n <> 1 or hit <> yes then raise exception 'U314: % matches, first %', n, hit; end if;
end $$;

-- U84: inserting a note whose text is new adds a thought with the note's content and metadata, reported as created
do $$
declare txt text := 'U84 note ' || gen_random_uuid(); r jsonb; t thoughts;
begin
  r := attachment_insert_note(txt, array_fill(0, array[1536])::vector::text,
    '{"type":"observation","source":"thought-attachments","source_type":"thought_attachments_note"}'::jsonb);
  select * into t from thoughts where id = (r->>'id')::uuid;
  delete from thoughts where id = (r->>'id')::uuid;
  if (r->>'created')::boolean is not true then raise exception 'U84: not reported as created: %', r; end if;
  if t.content <> txt or t.metadata->>'source_type' <> 'thought_attachments_note' or t.metadata->>'type' <> 'observation'
     or t.embedding is null or t.content_fingerprint is null then
    raise exception 'U84: stored row differs: %', t;
  end if;
end $$;

-- U85: a note whose fingerprint exists returns that thought as not created, and leaves it unchanged
do $$
declare txt text := 'U85 note ' || gen_random_uuid(); o uuid; r jsonb; t thoughts;
begin
  insert into thoughts (content, content_fingerprint, metadata)
    values (txt, encode(sha256(convert_to(lower(trim(regexp_replace(txt, '\s+', ' ', 'g'))), 'UTF8')), 'hex'), '{"owner":true}') returning id into o;
  r := attachment_insert_note('  ' || upper(txt), array_fill(0, array[1536])::vector::text, '{"type":"observation"}'::jsonb);
  select * into t from thoughts where id = o;
  delete from thoughts where id = o;
  if (r->>'id')::uuid <> o or (r->>'created')::boolean is not false then raise exception 'U85: got %', r; end if;
  if t.content <> txt or t.metadata <> '{"owner":true}'::jsonb or t.embedding is not null then raise exception 'U85: thought changed: %', t; end if;
end $$;

-- U86: the page-token lookup finds a row by page_token_hash only
do $$
declare p uuid := pg_temp.mk_parent(); a uuid; b uuid := pg_temp.mk_att(p); hit uuid; n_other int; n_null int; n_id int;
begin
  insert into thought_attachments (parent_thought_id, state, upload_deadline, page_token_hash)
    values (p, 'pending_upload', now(), 'sha256:u86hash') returning id into a;
  select id into hit from attachment_by_page_token('sha256:u86hash');
  select count(*) into n_other from attachment_by_page_token('sha256:other');
  select count(*) into n_null from attachment_by_page_token(null);
  select count(*) into n_id from attachment_by_page_token(a::text);
  delete from thought_attachments where id = a;
  delete from thought_attachments where id = b;
  delete from thoughts where id = p;
  if hit is distinct from a then raise exception 'U86: lookup returned %', hit; end if;
  if n_other <> 0 or n_null <> 0 or n_id <> 0 then raise exception 'U86: matched by something else (% % %)', n_other, n_null, n_id; end if;
end $$;

-- U87: consuming a page token succeeds once and clears the hash; a second consume fails
do $$
declare p uuid := pg_temp.mk_parent(); a uuid; first_ boolean; second_ boolean; wrong boolean; h text;
begin
  insert into thought_attachments (parent_thought_id, state, upload_deadline, page_token_hash)
    values (p, 'pending_upload', now(), 'sha256:u87hash') returning id into a;
  wrong := attachment_consume_page_token(a, 'sha256:not-it');
  first_ := attachment_consume_page_token(a, 'sha256:u87hash');
  second_ := attachment_consume_page_token(a, 'sha256:u87hash');
  select page_token_hash into h from thought_attachments where id = a;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if wrong then raise exception 'U87: a wrong hash was consumed'; end if;
  if first_ is not true or second_ is not false or h is not null then raise exception 'U87: first %, second %, hash %', first_, second_, h; end if;
end $$;

-- U94: a set-state under a valid claim records state and state_reason and leaves the derived thoughts
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p); r thought_attachments; n bigint;
begin
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u94 one ' || a, 'u94 two ' || a), '{"state":"processed"}'::jsonb);
  r := attachment_set_state(a, 'tok', '{"state":"failed","state_reason":"the run did not finish"}'::jsonb);
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if r.state <> 'failed' or r.state_reason <> 'the run did not finish' then raise exception 'U94: returned %', r; end if;
  if n <> 2 or r.derived_count <> 2 then raise exception 'U94: derived thoughts changed (% rows, derived_count %)', n, r.derived_count; end if;
end $$;

-- U93: a write or set-state with an old token, after a newer claim took over, is refused and changes nothing
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'pending_upload', interval '-1 second');
        old_tok text; new_tok text; w_refused boolean := false; s_refused boolean := false; n bigint; st text;
begin
  old_tok := attachment_claim(a, 'finish', 60)->>'token';
  update thought_attachments set busy_until = now() - interval '1 second' where id = a;  -- the first claim lapsed
  new_tok := attachment_claim(a, 'finish', 60)->>'token';
  begin
    perform attachment_write_derived(a, old_tok, pg_temp.rows_json('u93 ' || a), '{"state":"processed"}'::jsonb);
  exception when others then w_refused := sqlerrm like '%claim%';
  end;
  begin
    perform attachment_set_state(a, old_tok, '{"state":"failed"}'::jsonb);
  exception when others then s_refused := sqlerrm like '%claim%';
  end;
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  select state into st from thought_attachments where id = a;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if old_tok = new_tok then raise exception 'U93: the new claim reused the token'; end if;
  if not w_refused then raise exception 'U93: a write with the old token was not refused'; end if;
  if not s_refused then raise exception 'U93: a set-state with the old token was not refused'; end if;
  if n <> 0 or st <> 'pending_upload' then raise exception 'U93: changed (% rows, state %)', n, st; end if;
end $$;

-- U95: remove under a valid claim deletes that attachment's derived thoughts and its row, in one transaction
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'processed'); r jsonb; n bigint; rows_ bigint;
begin
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u95 one ' || a, 'u95 two ' || a), '{"state":"processed"}'::jsonb);
  r := attachment_remove(a, 'tok');
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  select count(*) into rows_ from thought_attachments where id = a;
  delete from thoughts where id = p;
  if (r->>'derived')::int <> 2 or (r->>'noteRemoved')::boolean is not false then raise exception 'U95: returned %', r; end if;
  if n <> 0 or rows_ <> 0 then raise exception 'U95: % derived thoughts and % rows remain', n, rows_; end if;
end $$;

-- U96: remove leaves the parent, and another attachment of the same file on another thought with its derived thoughts
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'processed');
        p2 uuid := pg_temp.mk_parent(); b uuid := pg_temp.mk_att(p2, 'processed'); r jsonb; par bigint; other_n bigint; other_row bigint;
begin
  update thought_attachments set content_hash = 'sha256:u96' where id in (a, b);
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u96 a ' || a), '{"state":"processed"}'::jsonb);
  perform attachment_write_derived(b, 'tok', pg_temp.rows_json('u96 b1 ' || b, 'u96 b2 ' || b), '{"state":"processed"}'::jsonb);
  r := attachment_remove(a, 'tok');
  select count(*) into par from thoughts where id = p;
  select count(*) into other_n from thoughts where metadata->>'attachment_id' = b::text;
  select count(*) into other_row from thought_attachments where id = b;
  delete from thoughts where metadata->>'attachment_id' = b::text;
  delete from thought_attachments where id = b;
  delete from thoughts where id = p;
  delete from thoughts where id = p2;
  if par <> 1 then raise exception 'U96: the parent was removed'; end if;
  if other_n <> 2 or other_row <> 1 then raise exception 'U96: the other attachment lost data (% thoughts, % row)', other_n, other_row; end if;
end $$;

-- U97: remove without a valid claim is refused and deletes nothing
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'processed'); refused_wrong boolean := false; refused_expired boolean := false; n bigint; rows_ bigint;
begin
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u97 ' || a), '{"state":"processed"}'::jsonb);
  begin perform attachment_remove(a, 'wrong'); exception when others then refused_wrong := sqlerrm like '%claim%'; end;
  update thought_attachments set busy_until = now() - interval '1 second' where id = a;
  begin perform attachment_remove(a, 'tok'); exception when others then refused_expired := sqlerrm like '%claim%'; end;
  select count(*) into n from thoughts where metadata->>'attachment_id' = a::text;
  select count(*) into rows_ from thought_attachments where id = a;
  delete from thoughts where metadata->>'attachment_id' = a::text;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  if not refused_wrong or not refused_expired then raise exception 'U97: not refused (wrong %, expired %)', refused_wrong, refused_expired; end if;
  if n <> 1 or rows_ <> 1 then raise exception 'U97: something was deleted (% thoughts, % rows)', n, rows_; end if;
end $$;

-- Helper for the parent-note rules: set up a parent and an attachment, remove it, report what happened.
create or replace function pg_temp.note_case(p_state text, p_created_here boolean, p_deadline interval, p_other boolean default false) returns jsonb
language plpgsql as $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, p_state); o uuid; r jsonb; still boolean; pre jsonb;
begin
  update thought_attachments set parent_created_here = p_created_here, upload_deadline = now() + p_deadline where id = a;
  if p_other then
    insert into thought_attachments (parent_thought_id, state, upload_deadline) values (p, 'processed', now()) returning id into o;
  end if;
  pre := attachment_removal_preview(a);
  r := attachment_remove(a, 'tok');
  select exists (select 1 from thoughts where id = p) into still;
  if o is not null then delete from thought_attachments where id = o; end if;
  delete from thoughts where id = p;
  return jsonb_build_object('removed', r, 'preview', pre, 'parent_still_there', still);
end $$;

-- U98: remove deletes the parent note when parent_created_here is true, the attachment ended refused and no other attachment points to it
do $$
declare r jsonb := pg_temp.note_case('refused', true, interval '1 hour');
begin
  if (r->'removed'->>'noteRemoved')::boolean is not true or (r->>'parent_still_there')::boolean then raise exception 'U98: %', r; end if;
end $$;

-- U99: remove deletes the parent note when the attachment is pending_upload past its deadline
do $$
declare r jsonb := pg_temp.note_case('pending_upload', true, interval '-1 second');
begin
  if (r->'removed'->>'noteRemoved')::boolean is not true or (r->>'parent_still_there')::boolean then raise exception 'U99: %', r; end if;
end $$;

-- U100: remove keeps the note when another attachment points to it
do $$
declare r jsonb := pg_temp.note_case('refused', true, interval '1 hour', true);
begin
  if (r->'removed'->>'noteRemoved')::boolean is not false or not (r->>'parent_still_there')::boolean then raise exception 'U100: %', r; end if;
end $$;

-- U101: remove keeps the parent when parent_created_here is false
do $$
declare r jsonb := pg_temp.note_case('refused', false, interval '1 hour');
begin
  if (r->'removed'->>'noteRemoved')::boolean is not false or not (r->>'parent_still_there')::boolean then raise exception 'U101: %', r; end if;
end $$;

-- U102: remove keeps the note when the attachment is processed
do $$
declare r jsonb := pg_temp.note_case('processed', true, interval '1 hour');
begin
  if (r->'removed'->>'noteRemoved')::boolean is not false or not (r->>'parent_still_there')::boolean then raise exception 'U102: %', r; end if;
end $$;

-- U103: remove keeps the note when the attachment is pending_upload before its deadline
do $$
declare r jsonb := pg_temp.note_case('pending_upload', true, interval '1 hour');
begin
  if (r->'removed'->>'noteRemoved')::boolean is not false or not (r->>'parent_still_there')::boolean then raise exception 'U103: %', r; end if;
end $$;

-- U104: the preview reports the same derived count and note flag the remove would, and deletes nothing
do $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, 'refused'); pre jsonb; r jsonb; n_before bigint; n_after bigint; rows_ bigint; par bigint;
begin
  update thought_attachments set parent_created_here = true where id = a;
  perform attachment_write_derived(a, 'tok', pg_temp.rows_json('u104 one ' || a, 'u104 two ' || a), '{"state":"refused"}'::jsonb);
  select count(*) into n_before from thoughts where metadata->>'attachment_id' = a::text;
  pre := attachment_removal_preview(a);
  select count(*) into n_after from thoughts where metadata->>'attachment_id' = a::text;
  select count(*) into rows_ from thought_attachments where id = a;
  select count(*) into par from thoughts where id = p;
  r := attachment_remove(a, 'tok');
  delete from thoughts where id = p;
  if pre is distinct from '{"derived": 2, "noteWouldGo": true}'::jsonb then raise exception 'U104: preview %', pre; end if;
  if n_before <> n_after or rows_ <> 1 or par <> 1 then raise exception 'U104: the preview deleted something'; end if;
  if (r->>'derived')::int <> (pre->>'derived')::int or r->'noteRemoved' <> pre->'noteWouldGo' then raise exception 'U104: remove % differs from preview %', r, pre; end if;
end $$;

-- Helper for the orphan checks: one attachment in a given shape, then what attachment_orphans(now()) says about it.
create or replace function pg_temp.orphan_case(p_state text, p_deadline interval, p_parent_exists boolean) returns jsonb
language plpgsql as $$
declare p uuid := pg_temp.mk_parent(); a uuid := pg_temp.mk_att(p, p_state); r jsonb;
begin
  update thought_attachments set upload_deadline = now() + p_deadline, derived_count = 3 where id = a;
  if not p_parent_exists then delete from thoughts where id = p; end if;
  select to_jsonb(o) into r from attachment_orphans(now()) o where (o.attachment->>'id')::uuid = a;
  delete from thought_attachments where id = a;
  delete from thoughts where id = p;
  return r;
end $$;

-- U105: orphans lists a row whose parent thought is gone, with why and derived_count
do $$
declare r jsonb := pg_temp.orphan_case('processed', interval '1 hour', false);
begin
  if r is null or r->>'why' <> 'parent_gone' or (r->'attachment'->>'derived_count')::int <> 3 then raise exception 'U105: %', r; end if;
end $$;

-- U106: orphans lists a pending_upload row past its upload_deadline
do $$
declare r jsonb := pg_temp.orphan_case('pending_upload', interval '-1 second', true);
begin
  if r is null or r->>'why' <> 'upload_expired' then raise exception 'U106: %', r; end if;
end $$;

-- U107: orphans omits a pending_upload row before its upload_deadline
do $$
declare r jsonb := pg_temp.orphan_case('pending_upload', interval '1 second', true);
begin
  if r is not null then raise exception 'U107: %', r; end if;
end $$;

-- U108: orphans lists a refused row
do $$
declare r jsonb := pg_temp.orphan_case('refused', interval '1 hour', true);
begin
  if r is null or r->>'why' <> 'refused' then raise exception 'U108: %', r; end if;
end $$;

-- U109: orphans omits a processed row whose parent exists
do $$
declare r jsonb := pg_temp.orphan_case('processed', interval '1 hour', true);
begin
  if r is not null then raise exception 'U109: %', r; end if;
end $$;
