-- Applied as little_steps_backend_access_hardening to dedicated Little Steps project.
begin;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
create index practice_attempts_lesson_idx on public.practice_attempts(lesson_id,lesson_version);
commit;
