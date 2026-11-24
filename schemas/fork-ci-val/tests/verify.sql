\ir ../schema.sql
do $$
begin
  if to_regclass('public.thought_labels') is null then
    raise exception 'thought_labels missing';
  end if;
  -- deliberate failure for validation: this column does not exist
  if not exists (select 1 from information_schema.columns
                 where table_name = 'thought_labels' and column_name = 'confidence') then
    raise exception 'thought_labels.confidence missing';
  end if;
end
$$;
