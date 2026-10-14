-- Read-only inspection after applying schema-draft.sql to the NEW project.
-- These checks do not replace two-user Data API authorization tests in README.md.
select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('lesson_catalog', 'learner_profiles', 'practice_attempts')
order by c.relname;
-- Expected: exactly three rows, every relrowsecurity=true.

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('lesson_catalog', 'learner_profiles', 'practice_attempts')
order by tablename, cmd;
-- Expected: catalogue published-only SELECT; each private table own SELECT/INSERT/DELETE.
-- No UPDATE or permissive all-users policy on either private table.

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and table_name in ('lesson_catalog', 'learner_profiles', 'practice_attempts')
order by table_name, grantee, privilege_type;
-- Expected: anon catalogue SELECT only; authenticated catalogue SELECT,
-- private SELECT/DELETE only at table level; INSERT exists only as column grants.

select table_name, grantee, column_name, privilege_type
from information_schema.role_column_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and table_name in ('lesson_catalog', 'learner_profiles', 'practice_attempts')
  and privilege_type = 'INSERT'
order by table_name, column_name;
-- Expected: authenticated owner/learner IDs on learner_profiles; explicit attempt
-- payload columns on practice_attempts; no created_at/received_at or catalogue INSERT.

select tc.table_name, tc.constraint_type, tc.constraint_name
from information_schema.table_constraints tc
where tc.table_schema = 'public'
  and tc.table_name in ('lesson_catalog', 'learner_profiles', 'practice_attempts')
order by tc.table_name, tc.constraint_type;
-- Inspect composite owner/learner and lesson/version FKs, PKs and CHECK constraints.
