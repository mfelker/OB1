\ir ../schema.sql
do $$
begin
  if to_regclass('public.thought_labels') is null then
    raise exception 'thought_labels missing';
  end if;
end
$$;
