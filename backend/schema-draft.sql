-- DRAFT ONLY. Not applied to a database; create a dedicated Little Steps project first.
-- Reviewed against current Supabase RLS docs on 2026-10-14.
begin;

create table public.lesson_catalog (
  lesson_id text not null check (lesson_id ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  version integer not null check (version > 0),
  title text not null check (char_length(title) between 1 and 120),
  topic text not null check (topic ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  grade_min smallint not null check (grade_min between 1 and 7),
  grade_max smallint not null check (grade_max between grade_min and 7),
  language text not null default 'en' check (language = 'en'),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (lesson_id, version)
);

-- No names, ages, email addresses, chat messages, audio, or raw answers.
-- learner_id is a random local identifier within an adult-controlled account.
create table public.learner_profiles (
  owner_id uuid not null references auth.users(id) on delete cascade,
  learner_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, learner_id)
);

-- Attempts are append-only and idempotent; deletion is available to the owner.
create table public.practice_attempts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  learner_id uuid not null,
  lesson_id text not null,
  lesson_version integer not null,
  outcome text not null check (outcome in ('completed', 'needs_practice')),
  hints_used smallint not null default 0 check (hints_used between 0 and 100),
  worked_example_used boolean not null default false,
  received_at timestamptz not null default now(),
  primary key (owner_id, event_id),
  foreign key (owner_id, learner_id)
    references public.learner_profiles(owner_id, learner_id) on delete cascade,
  foreign key (lesson_id, lesson_version)
    references public.lesson_catalog(lesson_id, version)
);
create index practice_attempts_owner_learner_idx
  on public.practice_attempts (owner_id, learner_id, received_at);

alter table public.lesson_catalog enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.practice_attempts enable row level security;

-- Explicit grants avoid relying on project-specific default privileges.
revoke all on public.lesson_catalog from public, anon, authenticated;
revoke all on public.learner_profiles from public, anon, authenticated;
revoke all on public.practice_attempts from public, anon, authenticated;
grant select on public.lesson_catalog to anon, authenticated;
grant select, delete on public.learner_profiles to authenticated;
grant insert (owner_id, learner_id) on public.learner_profiles to authenticated;
grant select, delete on public.practice_attempts to authenticated;
grant insert (owner_id, event_id, learner_id, lesson_id, lesson_version,
  outcome, hints_used, worked_example_used) on public.practice_attempts to authenticated;
grant all on public.lesson_catalog, public.learner_profiles, public.practice_attempts to service_role;

create policy catalog_read_published on public.lesson_catalog
  for select to anon, authenticated using (published = true);
create policy learners_read_own on public.learner_profiles
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy learners_insert_own on public.learner_profiles
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy learners_delete_own on public.learner_profiles
  for delete to authenticated using ((select auth.uid()) = owner_id);
create policy progress_read_own on public.practice_attempts
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy progress_insert_own on public.practice_attempts
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy progress_delete_own on public.practice_attempts
  for delete to authenticated using ((select auth.uid()) = owner_id);
-- No UPDATE policy/grant, no client catalog-write policy, no definer function/view.
commit;
