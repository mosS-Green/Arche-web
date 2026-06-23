-- ============================================================================
-- Arché Database Schema (RLS Disabled for Personal Single-User Setup)
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
create extension if not exists "uuid-ossp";

-- Drop existing tables to ensure constraints are removed (Clean start)
drop table if exists public.work_notes cascade;
drop table if exists public.work_reminders cascade;
drop table if exists public.work_tasks cascade;
drop table if exists public.hobbies cascade;
drop table if exists public.media cascade;
drop table if exists public.musings cascade;
drop table if exists public.goals_plans cascade;
drop table if exists public.quotes cascade;
drop table if exists public.ideas cascade;
drop table if exists public.personal_reminders cascade;
drop table if exists public.personal_tasks cascade;
drop table if exists public.profiles cascade;

-- ----------------------------------------------------------------------------
-- 1. Profiles Table
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Disable RLS
alter table public.profiles disable row level security;

-- ----------------------------------------------------------------------------
-- 2. Personal Tasks
-- ----------------------------------------------------------------------------
create table if not exists public.personal_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  description text,
  category text not null,
  priority text not null check (priority in ('Low', 'Medium', 'High', 'Critical')),
  deadline date,
  status text not null default 'To Do' check (status in ('To Do', 'In Progress', 'Done')),
  energy_required text not null check (energy_required in ('Low', 'Medium', 'High')),
  tags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.personal_tasks disable row level security;
create index if not exists personal_tasks_user_id_idx on public.personal_tasks(user_id);

-- ----------------------------------------------------------------------------
-- 3. Personal Reminders
-- ----------------------------------------------------------------------------
create table if not exists public.personal_reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  description text,
  type text not null check (type in ('One Time', 'Daily', 'Weekly', 'Monthly')),
  date date not null,
  time time,
  repeat_until date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.personal_reminders disable row level security;
create index if not exists personal_reminders_user_id_idx on public.personal_reminders(user_id);

-- ----------------------------------------------------------------------------
-- 4. Ideas
-- ----------------------------------------------------------------------------
create table if not exists public.ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  description text,
  category text not null,
  excitement integer not null check (excitement >= 1 and excitement <= 5),
  difficulty integer not null check (difficulty >= 1 and difficulty <= 5),
  status text not null default 'Draft' check (status in ('Draft', 'Refined', 'Active', 'Completed', 'Shelved')),
  related_hobby text,
  tags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ideas disable row level security;
create index if not exists ideas_user_id_idx on public.ideas(user_id);

-- ----------------------------------------------------------------------------
-- 5. Quotes
-- ----------------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  quote text not null,
  author text,
  source text,
  category text not null,
  favourite boolean default false not null,
  personal_thoughts text,
  tags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quotes disable row level security;
create index if not exists quotes_user_id_idx on public.quotes(user_id);

-- ----------------------------------------------------------------------------
-- 6. Goals / Plans
-- ----------------------------------------------------------------------------
create table if not exists public.goals_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  description text,
  target_date date not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Achieved', 'Paused')),
  milestones jsonb default '[]'::jsonb,
  related_hobby text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goals_plans disable row level security;
create index if not exists goals_plans_user_id_idx on public.goals_plans(user_id);

-- ----------------------------------------------------------------------------
-- 7. Musings
-- ----------------------------------------------------------------------------
create table if not exists public.musings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text,
  body text not null,
  mood text not null,
  tags text[] default '{}'::text[],
  favourite boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.musings disable row level security;
create index if not exists musings_user_id_idx on public.musings(user_id);

-- ----------------------------------------------------------------------------
-- 8. Media
-- ----------------------------------------------------------------------------
create table if not exists public.media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  type text not null check (type in ('Music', 'Book', 'Series', 'Movie', 'Game')),
  status text not null check (status in ('Backlog', 'Consuming', 'Completed', 'Abandoned')),
  rating integer check (rating >= 1 and rating <= 5),
  progress integer default 0,
  genre text,
  thoughts text,
  recommendation_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.media disable row level security;
create index if not exists media_user_id_idx on public.media(user_id);

-- ----------------------------------------------------------------------------
-- 9. Hobbies
-- ----------------------------------------------------------------------------
create table if not exists public.hobbies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  hobby text not null,
  duration integer not null, -- in minutes
  notes text,
  enjoyment integer not null check (enjoyment >= 1 and enjoyment <= 5),
  difficulty integer not null check (difficulty >= 1 and difficulty <= 5),
  tags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.hobbies disable row level security;
create index if not exists hobbies_user_id_idx on public.hobbies(user_id);

-- ----------------------------------------------------------------------------
-- 10. Work Tasks
-- ----------------------------------------------------------------------------
create table if not exists public.work_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  description text,
  priority text not null check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'To Do' check (status in ('To Do', 'In Progress', 'Done')),
  deadline date,
  time time,
  tags text[] default '{}'::text[],
  estimated_duration integer, -- in minutes
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.work_tasks disable row level security;
create index if not exists work_tasks_user_id_idx on public.work_tasks(user_id);

-- ----------------------------------------------------------------------------
-- 11. Work Reminders
-- ----------------------------------------------------------------------------
create table if not exists public.work_reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  description text,
  type text not null check (type in ('One Time', 'Daily', 'Weekly', 'Monthly')),
  date date not null,
  time time,
  repeat_until date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.work_reminders disable row level security;
create index if not exists work_reminders_user_id_idx on public.work_reminders(user_id);

-- ----------------------------------------------------------------------------
-- 12. Work Notes
-- ----------------------------------------------------------------------------
create table if not exists public.work_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  body text,
  tags text[] default '{}'::text[],
  project text,
  pin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.work_notes disable row level security;
create index if not exists work_notes_user_id_idx on public.work_notes(user_id);

-- ----------------------------------------------------------------------------
-- 13. Expose to Data API
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated;
