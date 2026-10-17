-- Partenaires (remises négociées) + tombola. Tables préfixées armurerie_, n'affectent pas l'EMS.

create table if not exists armurerie_partners (
  id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  custom_pct numeric(5,2) not null default 0 check (custom_pct between 0 and 100),
  weapons_pct numeric(5,2) not null default 0 check (weapons_pct between 0 and 100),
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists armurerie_raffle_entries (
  id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  tickets integer not null check (tickets between 1 and 100000),
  created_at timestamptz not null default now()
);

create table if not exists armurerie_raffle_draws (
  id text primary key,
  winner text not null,
  winner_tickets integer not null,
  total_tickets integer not null,
  participants integer not null,
  prize text not null default '',
  created_at timestamptz not null default now()
);

-- la vente garde le partenaire et le montant de sa remise
alter table armurerie_orders add column if not exists partner_name text;
alter table armurerie_orders add column if not exists partner_discount numeric(12,2) not null default 0;

alter table armurerie_partners enable row level security;
alter table armurerie_raffle_entries enable row level security;
alter table armurerie_raffle_draws enable row level security;
do $$
declare t text;
begin
  foreach t in array array['armurerie_partners','armurerie_raffle_entries','armurerie_raffle_draws'] loop
    execute format('drop policy if exists "armurerie acces public" on %I', t);
    execute format('create policy "armurerie acces public" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

alter publication supabase_realtime add table armurerie_partners, armurerie_raffle_entries, armurerie_raffle_draws;

insert into armurerie_partners (id, name, custom_pct, weapons_pct, notes)
values ('saloon-blackwater', 'Saloon de Blackwater', 10, 3, 'Partenariat : −10 % sur la personnalisation, −3 % sur le prix des armes.')
on conflict (id) do nothing;
