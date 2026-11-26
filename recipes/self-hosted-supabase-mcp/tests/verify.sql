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
\ir ../db/ob1-schema.sql

-- U41: the embedding column is vector(1536).
DO $$ BEGIN
  IF (SELECT format_type(atttypid, atttypmod) FROM pg_attribute
      WHERE attrelid = 'public.thoughts'::regclass AND attname = 'embedding') IS DISTINCT FROM 'vector(1536)' THEN
    RAISE EXCEPTION 'U41 thoughts.embedding is not vector(1536)';
  END IF;
END $$;
