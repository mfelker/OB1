-- verify.sql: checks db/ob1-schema.sql in a fresh scratch database (fork-ci SQL runtime).
-- Run from recipes/self-hosted-supabase-mcp/ with: psql -v ON_ERROR_STOP=1 -X -q -f tests/verify.sql
-- Each run uses a new database name, so it can run again on the same Postgres; nothing is dropped.
SELECT 'ob1_verify_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS') || '_' || (random() * 1000000)::int AS verify_db \gset
CREATE DATABASE :"verify_db";
\c :"verify_db"
-- docs/01 enables pgvector in the dashboard before any SQL runs; do the same here.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE
  AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
-- Supabase runs first-boot SQL as its own superuser (supabase_admin), not as postgres.
-- Apply the file the same way, so the ownership check below means something.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ob1_init_runner') THEN
    CREATE ROLE ob1_init_runner SUPERUSER NOLOGIN;
  END IF;
END $$;
SET ROLE ob1_init_runner;
\ir ../db/ob1-schema.sql
RESET ROLE;

-- U41: the embedding column is vector(1536).
DO $$ BEGIN
  IF (SELECT format_type(atttypid, atttypmod) FROM pg_attribute
      WHERE attrelid = 'public.thoughts'::regclass AND attname = 'embedding') IS DISTINCT FROM 'vector(1536)' THEN
    RAISE EXCEPTION 'U41 thoughts.embedding is not vector(1536)';
  END IF;
END $$;

-- U42: both RPCs exist.
DO $$ BEGIN
  IF to_regproc('public.match_thoughts') IS NULL OR to_regproc('public.upsert_thought') IS NULL THEN
    RAISE EXCEPTION 'U42 match_thoughts or upsert_thought is missing';
  END IF;
END $$;

-- U43: service_role may insert into thoughts (the GRANT step CONTRIBUTING.md requires).
DO $$ BEGIN
  IF NOT has_table_privilege('service_role', 'public.thoughts', 'INSERT') THEN
    RAISE EXCEPTION 'U43 service_role has no INSERT on public.thoughts';
  END IF;
END $$;

-- U44: row level security is on for thoughts.
DO $$ BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.thoughts'::regclass) THEN
    RAISE EXCEPTION 'U44 row level security is off on thoughts';
  END IF;
END $$;

-- U45: thoughts and both RPCs are owned by postgres, as on Supabase Cloud.
DO $$ BEGIN
  IF (SELECT relowner::regrole::text FROM pg_class WHERE oid = 'public.thoughts'::regclass) <> 'postgres'
     OR (SELECT count(*) FROM pg_proc WHERE proname IN ('match_thoughts', 'upsert_thought')
         AND proowner::regrole::text <> 'postgres') > 0 THEN
    RAISE EXCEPTION 'U45 thoughts or its RPCs are not owned by postgres';
  END IF;
END $$;
