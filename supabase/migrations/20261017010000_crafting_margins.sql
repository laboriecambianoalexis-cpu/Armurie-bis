-- Canonical crafting recipe and persisted sale allocation for the Armurerie schema.
-- The active material table in this project is armurerie_materials (not lb_armurerie_materials).

alter table public.armurerie_products
  add column if not exists craft_tax numeric(12,2) not null default 0,
  add column if not exists craft_recipe jsonb not null default '[]'::jsonb;

alter table public.armurerie_materials
  add column if not exists unit_cost numeric(12,4) not null default 0;

alter table public.armurerie_orders
  add column if not exists caisse_part numeric(12,2) not null default 0,
  add column if not exists vendor_part numeric(12,2) not null default 0,
  add column if not exists craft_cost numeric(12,2) not null default 0,
  add column if not exists vendor_id text;

-- Copy recipes created by older clients into the normalized list format.
update public.armurerie_products p
set craft_recipe = case
  when jsonb_typeof(p.ingredients) = 'array' and p.ingredients <> '[]'::jsonb then p.ingredients
  else coalesce((
    select jsonb_agg(jsonb_build_object('materialId', entry.key, 'qty', entry.value::numeric))
    from jsonb_each_text(coalesce(p.recipe, '{}'::jsonb)) as entry
  ), '[]'::jsonb)
end
where p.craft_recipe = '[]'::jsonb;

-- Backfill order-level allocation summaries from the immutable line snapshots.
update public.armurerie_orders o
set caisse_part = coalesce((
      select sum(coalesce(nullif(line.item->>'caisse_part', '')::numeric,
                          nullif(line.item->>'caissePart', '')::numeric))
      from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as line(item)
      where nullif(line.item->>'caisse_part', '') is not null
         or nullif(line.item->>'caissePart', '') is not null
    ), (
      select sum(coalesce(nullif(line.item->>'shopShare', '')::numeric, 0))
      from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as line(item)
    ) + coalesce(o.tax, 0), 0),
    vendor_part = coalesce((
      select sum(coalesce(nullif(line.item->>'vendor_part', '')::numeric,
                           nullif(line.item->>'vendorPart', '')::numeric,
                           nullif(line.item->>'sellerShare', '')::numeric, 0))
      from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as line(item)
    ), 0),
    craft_cost = coalesce((
      select sum(coalesce(nullif(line.item->>'craft_cost', '')::numeric,
                           nullif(line.item->>'craftCost', '')::numeric,
                           nullif(line.item->>'cost', '')::numeric * coalesce(nullif(line.item->>'qty', '')::numeric, 1), 0))
      from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as line(item)
    ), 0)
where o.caisse_part = 0 and o.vendor_part = 0 and o.craft_cost = 0;

-- Resolve existing seller names to the shared employee IDs where possible.
update public.armurerie_orders o
set vendor_id = s.id
from public.armurerie_staff s
where o.vendor_id is null
  and o.seller is not null
  and lower(btrim(s.name)) = lower(btrim(o.seller));

-- Preserve the app's existing anonymous read/write model on the affected tables.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['armurerie_products', 'armurerie_materials', 'armurerie_orders'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "armurerie acces public" ON public.%I', t);
    EXECUTE format('CREATE POLICY "armurerie acces public" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
  END LOOP;
END $$;

-- These existing tables are consumed by the current realtime subscriptions.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['armurerie_products', 'armurerie_materials', 'armurerie_orders'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
