-- Rachat d'armes d'occasion : achetées 70 % du prix catalogue, revendues 90 %.
create table if not exists armurerie_buyback (
  id text primary key,
  product_id text,
  name text not null check (char_length(name) between 1 and 120),
  buy_price numeric(12,2) not null check (buy_price >= 0),
  sell_price numeric(12,2) not null check (sell_price >= 0),
  bought_from text not null default '',
  bought_by text,
  note text not null default '',
  bought_at timestamptz not null default now(),
  sold_at timestamptz,
  sold_to text,
  sold_by text,
  sold_price numeric(12,2)
);

alter table armurerie_buyback enable row level security;
drop policy if exists "armurerie acces public" on armurerie_buyback;
create policy "armurerie acces public" on armurerie_buyback for all to anon, authenticated using (true) with check (true);
alter publication supabase_realtime add table armurerie_buyback;
