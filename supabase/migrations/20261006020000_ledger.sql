-- Livre de compte : dépôts / retraits manuels et ajustements de solde (les ventes et taxes sont calculées depuis les commandes).
create table if not exists armurerie_ledger (
  id text primary key,
  kind text not null check (kind in ('depot', 'retrait', 'ajustement')),
  author text not null default '' check (char_length(author) <= 80),
  label text not null default '' check (char_length(label) <= 200),
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists armurerie_ledger_created_at_idx on armurerie_ledger (created_at desc);

alter table armurerie_ledger enable row level security;
drop policy if exists "armurerie acces public" on armurerie_ledger;
create policy "armurerie acces public" on armurerie_ledger for all to anon, authenticated using (true) with check (true);
alter publication supabase_realtime add table armurerie_ledger;
