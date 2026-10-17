-- Keep the normalized ingredient list for the newer catalogue model while preserving recipe for older clients.
alter table armurerie_products
  add column if not exists ingredients jsonb not null default '[]'::jsonb;

update armurerie_products
set ingredients = coalesce(
  (
    select jsonb_agg(jsonb_build_object('materialId', entry.key, 'qty', entry.value::numeric))
    from jsonb_each_text(coalesce(recipe, '{}'::jsonb)) as entry
  ),
  '[]'::jsonb
)
where ingredients = '[]'::jsonb and recipe <> '{}'::jsonb;
