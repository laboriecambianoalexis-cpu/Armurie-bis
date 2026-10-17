-- Stock de matières premières + coût de fabrication (taxes admin + recettes) pour la compta.

alter table armurerie_products add column if not exists craft_tax numeric(12,2) not null default 0;
alter table armurerie_products add column if not exists recipe jsonb not null default '{}'::jsonb;

create table if not exists armurerie_materials (
  id text primary key,
  name text not null check (char_length(name) between 1 and 60),
  stock numeric(12,2) not null default 0,
  threshold numeric(12,2) not null default 0,
  unit_cost numeric(12,4) not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- mouvement de stock atomique (plusieurs caisses en même temps)
create or replace function armurerie_adjust_material(p_id text, p_delta numeric)
returns void language sql security invoker as $$
  update armurerie_materials set stock = greatest(0, stock + p_delta) where id = p_id;
$$;
grant execute on function armurerie_adjust_material(text, numeric) to anon, authenticated;

alter table armurerie_materials enable row level security;
drop policy if exists "armurerie acces public" on armurerie_materials;
create policy "armurerie acces public" on armurerie_materials for all to anon, authenticated using (true) with check (true);
alter publication supabase_realtime add table armurerie_materials;

-- matières (stock relevé sur les fiches de fabrication)
insert into armurerie_materials (id, name, stock, threshold, unit_cost, position) values
  ('cuir', 'Cuir', 105, 10, 0, 1),
  ('planches', 'Pile de planches', 534, 100, 0, 2),
  ('fer', 'Fer', 514, 100, 0, 3),
  ('plomb', 'Plomb', 0, 100, 0.10, 4),
  ('soufre', 'Soufre', 0, 100, 0.10, 5),
  ('graisse', 'Graisse d''animal', 26, 5, 0, 6),
  ('coton', 'Coton', 46, 10, 0, 7)
on conflict (id) do nothing;

-- recettes + frais admin / taxes de fabrication (fiches en jeu)
update armurerie_products p set craft_tax = v.tax, recipe = v.recipe::jsonb from (values
  ('car-repeat', 56.98, '{"cuir":1,"planches":10,"fer":10}'),
  ('bl-knife', 1.40, '{"planches":2,"fer":2}'),
  ('bl-rustic', 1.90, '{"planches":2,"fer":2}'),
  ('bl-throwing', 8.80, '{"planches":4,"fer":4}'),
  ('bl-hatchet', 11.80, '{"planches":4,"fer":4}'),
  ('pom-sawed', 253.98, '{"cuir":1,"planches":20,"fer":20}'),
  ('pom-double', 338.98, '{"cuir":1,"planches":20,"fer":20}'),
  ('pom-elephant', 293.98, '{"cuir":1,"planches":20,"fer":20}'),
  ('pom-pump', 288.98, '{"cuir":1,"planches":20,"fer":20}'),
  ('pom-repeating', 228.98, '{"cuir":1,"planches":20,"fer":20}'),
  ('pom-semi', 258.98, '{"cuir":1,"planches":20,"fer":20}'),
  ('fus-bolt', 160.48, '{"cuir":1,"planches":15,"fer":15}'),
  ('fus-carcano', 494.98, '{"cuir":1,"planches":50,"fer":50}'),
  ('fus-rolling', 460.00, '{"cuir":1,"planches":50,"fer":50}'),
  ('fus-springfield', 185.48, '{"cuir":1,"planches":15,"fer":15}'),
  ('fus-varmint', 53.48, '{"cuir":1,"planches":5,"fer":5}'),
  ('acc-oil', 0, '{"graisse":1}'),
  ('acc-binoculars', 0, '{"fer":2}'),
  ('acc-lasso', 0, '{"coton":2}'),
  ('mun-rev', 0, '{"plomb":1,"soufre":1}'),
  ('mun-pis', 0, '{"plomb":1,"soufre":1}'),
  ('mun-car', 0, '{"plomb":1,"soufre":1}'),
  ('mun-varmint', 0, '{"plomb":1,"soufre":1}'),
  ('mun-varmint-tranq', 0, '{"plomb":1,"soufre":1}'),
  ('mun-fus', 0, '{"plomb":1,"soufre":1}'),
  ('mun-elephant', 0, '{"plomb":1,"soufre":1}'),
  ('mun-pom', 0, '{"plomb":1,"soufre":1}')
) as v(id, tax, recipe) where p.id = v.id;

-- munitions d'armes à feu à 0,30 $
update armurerie_products set price = 0.30
where id in ('mun-rev','mun-pis','mun-car','mun-varmint','mun-varmint-tranq','mun-fus','mun-elephant','mun-pom');
