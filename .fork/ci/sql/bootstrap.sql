-- fork-ci SQL bootstrap: applied to a THROWAWAY Postgres + pgvector database in CI only,
-- before a folder's tests/verify.sql runs (spec FR-011; research R10).
--
-- Provides Supabase basics that contribution SQL commonly references (roles, auth schema)
-- and the core Open Brain schema copied from docs/01-getting-started.md (steps 2.2 and 2.3).
-- The thoughts column list is drift-checked by .fork/ci/test/bootstrap-drift.test.mjs.
-- Idempotent and additive only (constitution Principle I).

-- Supabase roles
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end
$$;

-- Supabase auth helpers (stubs driven by request.jwt.claim.* settings)
create schema if not exists auth;

create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create or replace function auth.role() returns text
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;

create extension if not exists vector;

-- Core Open Brain schema (docs/01-getting-started.md, step 2.2)
create table if not exists thoughts (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists thoughts_embedding_idx on thoughts
  using hnsw (embedding vector_cosine_ops);
create index if not exists thoughts_metadata_idx on thoughts using gin (metadata);
create index if not exists thoughts_created_at_idx on thoughts (created_at desc);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'thoughts_updated_at') then
    create trigger thoughts_updated_at
      before update on thoughts
      for each row
      execute function update_updated_at();
  end if;
end
$$;

-- Core search function (docs/01-getting-started.md, step 2.3)
create or replace function match_thoughts(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  filter jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    t.id,
    t.content,
    t.metadata,
    1 - (t.embedding <=> query_embedding) as similarity,
    t.created_at
  from thoughts t
  where 1 - (t.embedding <=> query_embedding) > match_threshold
    and (filter = '{}'::jsonb or t.metadata @> filter)
  order by t.embedding <=> query_embedding
  limit match_count;
end;
$$;
