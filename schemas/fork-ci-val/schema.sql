-- fork-ci validation (temporary): additive table referencing the core thoughts table.
create table if not exists thought_labels (
  thought_id uuid references thoughts(id),
  label text not null
);
