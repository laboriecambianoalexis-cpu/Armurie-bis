-- Employés (vendeurs) + vendeur enregistré sur chaque vente.
create table if not exists armurerie_staff (
  id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table armurerie_orders add column if not exists seller text;

alter table armurerie_staff enable row level security;
drop policy if exists "armurerie acces public" on armurerie_staff;
create policy "armurerie acces public" on armurerie_staff for all to anon, authenticated using (true) with check (true);
alter publication supabase_realtime add table armurerie_staff;

-- noms vus dans le relevé de compte
insert into armurerie_staff (id, name) values ('rafael-iglesias', 'Rafael Iglesias'), ('wade-caldwell', 'Wade Caldwell')
on conflict (id) do nothing;
