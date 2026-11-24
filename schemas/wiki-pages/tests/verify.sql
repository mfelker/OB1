\ir ../schema.sql
do $$ begin
  raise exception 'e2e deliberate failure';
end $$;
