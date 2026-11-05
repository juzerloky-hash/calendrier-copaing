-- À exécuter dans Supabase : SQL Editor -> New query -> Run

create table if not exists public.dispos (
  id         bigint generated always as identity primary key,
  groupe     text not null check (groupe ~ '^[a-z0-9_-]{1,40}$'),
  date       date not null,
  user_id    text not null check (char_length(user_id) between 8 and 40),
  name       text not null check (char_length(name) between 1 and 30),
  status     text not null check (status in ('ok', 'maybe', 'no')),
  note       text check (note is null or char_length(note) <= 120),
  updated_at timestamptz not null default now(),
  unique (groupe, date, user_id)
);

create index if not exists dispos_groupe_idx on public.dispos (groupe, date);

alter table public.dispos enable row level security;

-- Accès ouvert à toute personne qui a le lien (pas de comptes).
create policy "lecture" on public.dispos for select to anon using (true);
create policy "ajout"   on public.dispos for insert to anon with check (true);
create policy "modif"   on public.dispos for update to anon using (true) with check (true);
create policy "suppr"   on public.dispos for delete to anon using (true);

-- Mises à jour en direct
alter publication supabase_realtime add table public.dispos;
