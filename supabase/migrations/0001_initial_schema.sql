-- ============================================================
-- MATCHDAY — Schéma Supabase
-- Multi-tenant : chaque organisateur a ses propres tournois
-- Lecture publique via codes d'accès, écriture protégée par RLS
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profil utilisateur (étend auth.users de Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz default now()
);

-- Bibliothèque d'équipes par utilisateur (réutilisable entre tournois)
create table if not exists public.team_library (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  short_name text not null,
  color text,
  logo_url text,
  category text,
  is_host boolean default false,
  created_at timestamptz default now()
);

-- Bibliothèque de sponsors par utilisateur
create table if not exists public.sponsor_library (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

-- Tournoi
create table if not exists public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  -- Code d'accès partagé aux spectateurs (unique global)
  access_code text unique not null,
  -- Code arbitre (peut être régénéré)
  referee_code text,
  name text not null,
  category text,
  date date,
  location text,
  start_time time default '09:00',
  match_duration int default 12,
  break_between_matches int default 3,
  fields jsonb default '["T1","T2","T3","T4"]'::jsonb,
  has_knockout boolean default true,
  knockout_from_top_n int default 2,
  category_durations jsonb default '{"U7":8,"U9":10,"U11":12,"U13":15,"U15":20,"U17":25,"Senior":30}'::jsonb,
  ranking_by_category jsonb default '{"U7":false,"U9":false,"U11":true,"U13":true,"U15":true,"U17":true,"Senior":true}'::jsonb,
  scoring jsonb default '{"win":3,"draw":1,"loss":0}'::jsonb,
  bonuses jsonb default '{}'::jsonb,
  tiebreakers jsonb default '["points","goalDiff","goalsFor","headToHead"]'::jsonb,
  -- 'live' | 'archived'
  status text default 'live',
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Équipe inscrite à un tournoi
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  -- Référence optionnelle vers la bibliothèque (pour traçabilité, pas obligatoire)
  library_id uuid references public.team_library(id) on delete set null,
  name text not null,
  short_name text not null,
  color text,
  logo_url text,
  category text,
  pool text not null,
  is_host boolean default false,
  level int default 0,
  created_at timestamptz default now()
);

-- Sponsor d'un tournoi
create table if not exists public.sponsors (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  library_id uuid references public.sponsor_library(id) on delete set null,
  name text not null,
  logo_url text,
  display_order int default 0,
  created_at timestamptz default now()
);

-- Annonce diffusée pendant un tournoi
create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  message text not null,
  -- 'info' | 'success' | 'warning' | 'urgent'
  type text default 'info',
  created_at timestamptz default now()
);

-- Match
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,

  -- Identité du match
  pool text,
  -- 'pool' | 'knockout'
  phase text default 'pool',
  -- Pour les knockouts : 'r16' | 'qf' | 'sf' | 'final' | '3rd'
  knockout_round text,
  knockout_index int,
  round int default 1,

  -- Équipes : soit team_id direct, soit slot symbolique pour les knockouts non résolus
  -- (ex: "slot:A#1" pour 1er poule A, "winner:<match_id>")
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  home_slot text,
  away_slot text,
  home_label text,
  away_label text,

  -- Planification
  field text,
  match_time time,
  referee text,

  -- Score & statut
  score_home int,
  score_away int,
  -- 'scheduled' | 'live' | 'validated'
  status text default 'scheduled',
  fairplay_home boolean,
  fairplay_away boolean,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Suivi spectateur : équipes suivies par utilisateur dans un tournoi
create table if not exists public.followed_teams (
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, team_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_tournaments_owner on public.tournaments(owner_id);
create index if not exists idx_tournaments_code on public.tournaments(access_code);
create index if not exists idx_tournaments_status on public.tournaments(status);
create index if not exists idx_teams_tournament on public.teams(tournament_id);
create index if not exists idx_teams_pool on public.teams(tournament_id, pool);
create index if not exists idx_matches_tournament on public.matches(tournament_id);
create index if not exists idx_matches_status on public.matches(tournament_id, status);
create index if not exists idx_matches_phase on public.matches(tournament_id, phase);
create index if not exists idx_matches_time on public.matches(tournament_id, match_time);
create index if not exists idx_team_library_owner on public.team_library(owner_id);
create index if not exists idx_sponsor_library_owner on public.sponsor_library(owner_id);
create index if not exists idx_sponsors_tournament on public.sponsors(tournament_id);
create index if not exists idx_announcements_tournament on public.announcements(tournament_id);
create index if not exists idx_followed_user on public.followed_teams(user_id);

-- ============================================================
-- TRIGGERS : updated_at automatique
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tournaments_updated on public.tournaments;
create trigger trg_tournaments_updated
  before update on public.tournaments
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_matches_updated on public.matches;
create trigger trg_matches_updated
  before update on public.matches
  for each row execute function public.touch_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- Modèle :
--   - L'organisateur (owner_id) a tous les droits sur ses tournois
--   - Tout le monde peut LIRE un tournoi via son access_code (lecture publique pour spectateurs)
--   - Les spectateurs n'écrivent que dans followed_teams (leurs propres lignes)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.sponsors enable row level security;
alter table public.announcements enable row level security;
alter table public.team_library enable row level security;
alter table public.sponsor_library enable row level security;
alter table public.followed_teams enable row level security;

-- ----- profiles -----
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- ----- tournaments -----
-- Lecture : owner OU tout utilisateur authentifié (les spectateurs ont besoin de lire)
-- En production on peut restreindre au seul access_code mais Supabase RLS ne filtre pas
-- naturellement par "code partagé". On laisse lecture authentifiée + on s'appuie sur le code
-- côté client pour cibler le bon tournoi.
drop policy if exists tournaments_select on public.tournaments;
create policy tournaments_select on public.tournaments
  for select using (true);  -- lecture publique, le code joue le rôle de filtre métier

drop policy if exists tournaments_insert_own on public.tournaments;
create policy tournaments_insert_own on public.tournaments
  for insert with check (auth.uid() = owner_id);

drop policy if exists tournaments_update_own on public.tournaments;
create policy tournaments_update_own on public.tournaments
  for update using (auth.uid() = owner_id);

drop policy if exists tournaments_delete_own on public.tournaments;
create policy tournaments_delete_own on public.tournaments
  for delete using (auth.uid() = owner_id);

-- ----- teams -----
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select using (true);

drop policy if exists teams_write_owner on public.teams;
create policy teams_write_owner on public.teams
  for all using (
    exists (
      select 1 from public.tournaments t
      where t.id = teams.tournament_id and t.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tournaments t
      where t.id = teams.tournament_id and t.owner_id = auth.uid()
    )
  );

-- ----- matches -----
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches
  for select using (true);

-- L'organisateur peut tout modifier. L'arbitre (authentifié) peut modifier scores
-- via une logique applicative — pour la simplicité on laisse l'organisateur seul ici,
-- les arbitres passent par une RPC dédiée (voir plus bas).
drop policy if exists matches_write_owner on public.matches;
create policy matches_write_owner on public.matches
  for all using (
    exists (
      select 1 from public.tournaments t
      where t.id = matches.tournament_id and t.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tournaments t
      where t.id = matches.tournament_id and t.owner_id = auth.uid()
    )
  );

-- ----- sponsors -----
drop policy if exists sponsors_select on public.sponsors;
create policy sponsors_select on public.sponsors
  for select using (true);

drop policy if exists sponsors_write_owner on public.sponsors;
create policy sponsors_write_owner on public.sponsors
  for all using (
    exists (
      select 1 from public.tournaments t
      where t.id = sponsors.tournament_id and t.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tournaments t
      where t.id = sponsors.tournament_id and t.owner_id = auth.uid()
    )
  );

-- ----- announcements -----
drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements
  for select using (true);

drop policy if exists announcements_write_owner on public.announcements;
create policy announcements_write_owner on public.announcements
  for all using (
    exists (
      select 1 from public.tournaments t
      where t.id = announcements.tournament_id and t.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tournaments t
      where t.id = announcements.tournament_id and t.owner_id = auth.uid()
    )
  );

-- ----- team_library -----
drop policy if exists team_library_own on public.team_library;
create policy team_library_own on public.team_library
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ----- sponsor_library -----
drop policy if exists sponsor_library_own on public.sponsor_library;
create policy sponsor_library_own on public.sponsor_library
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ----- followed_teams -----
-- Chaque utilisateur gère ses propres follow
drop policy if exists followed_teams_own on public.followed_teams;
create policy followed_teams_own on public.followed_teams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- RPC : saisie de score par un arbitre via le referee_code
-- Permet à un arbitre authentifié (qui n'est pas owner du tournoi)
-- de saisir un score s'il fournit le bon code.
-- ============================================================
create or replace function public.submit_match_score(
  p_match_id uuid,
  p_referee_code text,
  p_score_home int,
  p_score_away int,
  p_status text,
  p_fairplay_home boolean default null,
  p_fairplay_away boolean default null
) returns public.matches
language plpgsql security definer
as $$
declare
  v_match public.matches;
  v_tournament public.tournaments;
begin
  -- Récupérer le match
  select * into v_match from public.matches where id = p_match_id;
  if v_match is null then
    raise exception 'Match introuvable';
  end if;

  -- Vérifier le code arbitre du tournoi
  select * into v_tournament from public.tournaments where id = v_match.tournament_id;
  if v_tournament.referee_code is null or v_tournament.referee_code != p_referee_code then
    -- Si pas le bon code, exiger d'être owner
    if v_tournament.owner_id != auth.uid() then
      raise exception 'Code arbitre invalide';
    end if;
  end if;

  -- Mettre à jour
  update public.matches set
    score_home = p_score_home,
    score_away = p_score_away,
    status = p_status,
    fairplay_home = coalesce(p_fairplay_home, fairplay_home),
    fairplay_away = coalesce(p_fairplay_away, fairplay_away)
  where id = p_match_id
  returning * into v_match;

  return v_match;
end;
$$;

grant execute on function public.submit_match_score to authenticated;
