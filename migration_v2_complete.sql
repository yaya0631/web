-- ============================================================
-- GeoMan — COMPLETE SCHEMA (replaces migration_v2_align_schema.sql)
-- Run this in Supabase SQL Editor on a FRESH/EMPTY database.
-- KEY CHANGE vs previous migration: dossiers.id is TEXT
-- so human-readable IDs like "D-2025-LX4K3" are supported.
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- Drop existing tables (fresh install)
-- ============================================================
drop table if exists historique cascade;
drop table if exists fichiers cascade;
drop table if exists paiements cascade;
drop table if exists dossiers cascade;

-- ============================================================
-- dossiers (id = text for human-readable refs like D-2025-LX4K3)
-- ============================================================
create table dossiers (
  id                text primary key,
  user_id           uuid references auth.users(id) not null default auth.uid(),
  nom               text not null,
  endroit           text,
  telephone         text,
  date_finale       timestamp with time zone,
  montant           numeric default 0,
  acte              boolean not null default false,
  regul             boolean not null default false,
  agricole          boolean not null default false,
  depot_cad         text check (depot_cad in ('Depose', 'Non depose', 'Depose 2eme fois')),
  depot_domain      text,
  etat              text not null default 'actif'
                    check (etat in ('actif','termine','bloque','en_attente','en_retard','echeance_proche','solde_partiel','archive')),
  observations      text,
  archived          boolean not null default false,
  in_trash          boolean not null default false,
  date_archive      timestamp with time zone,
  created_at        timestamp with time zone default timezone('utc', now()) not null,
  updated_at        timestamp with time zone default timezone('utc', now()) not null
);

-- ============================================================
-- paiements
-- ============================================================
create table paiements (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) not null default auth.uid(),
  dossier_id  text references dossiers(id) on delete cascade not null,
  montant     numeric not null,
  date        timestamp with time zone default timezone('utc', now()) not null,
  note        text,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- ============================================================
-- fichiers
-- ============================================================
create table fichiers (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users(id) not null default auth.uid(),
  dossier_id   text references dossiers(id) on delete cascade not null,
  nom_fichier  text not null,
  storage_path text not null,
  taille       integer,
  type_mime    text,
  uploaded_at  timestamp with time zone default timezone('utc', now()) not null
);

-- ============================================================
-- historique
-- ============================================================
create table historique (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) not null default auth.uid(),
  dossier_id  text references dossiers(id) on delete cascade not null,
  action      text not null,
  details     jsonb,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on dossiers
  for each row execute function update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table dossiers   enable row level security;
alter table paiements  enable row level security;
alter table fichiers   enable row level security;
alter table historique enable row level security;

-- dossiers
create policy "own dossiers select" on dossiers for select using (auth.uid() = user_id);
create policy "own dossiers insert" on dossiers for insert with check (auth.uid() = user_id);
create policy "own dossiers update" on dossiers for update using (auth.uid() = user_id);
create policy "own dossiers delete" on dossiers for delete using (auth.uid() = user_id);

-- paiements
create policy "own paiements select" on paiements for select using (auth.uid() = user_id);
create policy "own paiements insert" on paiements for insert with check (auth.uid() = user_id);
create policy "own paiements update" on paiements for update using (auth.uid() = user_id);
create policy "own paiements delete" on paiements for delete using (auth.uid() = user_id);

-- fichiers
create policy "own fichiers select" on fichiers for select using (auth.uid() = user_id);
create policy "own fichiers insert" on fichiers for insert with check (auth.uid() = user_id);
create policy "own fichiers update" on fichiers for update using (auth.uid() = user_id);
create policy "own fichiers delete" on fichiers for delete using (auth.uid() = user_id);

-- historique
create policy "own historique select" on historique for select using (auth.uid() = user_id);
create policy "own historique insert" on historique for insert with check (auth.uid() = user_id);
create policy "own historique update" on historique for update using (auth.uid() = user_id);
create policy "own historique delete" on historique for delete using (auth.uid() = user_id);

-- ============================================================
-- Verify (uncomment to inspect after running)
-- ============================================================
-- select column_name, data_type, is_nullable from information_schema.columns where table_name = 'dossiers'   order by ordinal_position;
-- select column_name, data_type, is_nullable from information_schema.columns where table_name = 'paiements'  order by ordinal_position;
-- select column_name, data_type, is_nullable from information_schema.columns where table_name = 'fichiers'   order by ordinal_position;
-- select column_name, data_type, is_nullable from information_schema.columns where table_name = 'historique' order by ordinal_position;
