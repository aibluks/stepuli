-- Hosted authorization test. Synthetic UUID-only users; ALL fixtures roll back.
-- No passwords, identities, email delivery, sessions or permanent accounts created.
begin;
insert into auth.users(id) values
 ('a1111111-1111-4111-8111-111111111111'),
 ('b2222222-2222-4222-8222-222222222222');
insert into public.lesson_catalog(lesson_id,version,title,topic,grade_min,grade_max,content_sha256,published)
values ('rls-fixture-published',1,'Test fixture','addition',1,1,repeat('1',64),true),
       ('rls-fixture-draft',1,'Hidden fixture','addition',1,1,repeat('2',64),false);

set local role anon;
do $$ begin
  assert (select count(*) from public.lesson_catalog where lesson_id like 'rls-fixture-%')=1, 'anon catalogue filtering failed';
  begin perform * from public.learner_profiles; raise exception 'anon read profiles allowed'; exception when insufficient_privilege then null; end;
  begin perform * from public.practice_attempts; raise exception 'anon read attempts allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.lesson_catalog(lesson_id,version,title,topic,grade_min,grade_max,content_sha256) values ('bad',1,'Bad','addition',1,1,repeat('3',64)); raise exception 'anon catalog write allowed'; exception when insufficient_privilege then null; end;
end $$;

reset role;
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":false}',true);
set local role authenticated;
insert into public.learner_profiles(owner_id,learner_id) values ('a1111111-1111-4111-8111-111111111111','c3333333-3333-4333-8333-333333333333');
insert into public.practice_attempts(owner_id,event_id,learner_id,lesson_id,lesson_version,outcome)
values ('a1111111-1111-4111-8111-111111111111','d4444444-4444-4444-8444-444444444444','c3333333-3333-4333-8333-333333333333','rls-fixture-published',1,'completed');
do $$ begin
 assert (select count(*) from public.learner_profiles)=1, 'own profile unreadable';
 assert (select count(*) from public.practice_attempts)=1, 'own attempt unreadable';
 begin update public.practice_attempts set outcome='needs_practice'; raise exception 'update unexpectedly allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.practice_attempts(owner_id,event_id,learner_id,lesson_id,lesson_version,outcome) values ('a1111111-1111-4111-8111-111111111111','d4444444-4444-4444-8444-444444444444','c3333333-3333-4333-8333-333333333333','rls-fixture-published',1,'completed'); raise exception 'duplicate accepted'; exception when unique_violation then null; end;
 begin insert into public.practice_attempts(owner_id,event_id,learner_id,lesson_id,lesson_version,outcome,hints_used) values ('a1111111-1111-4111-8111-111111111111','e5555555-5555-4555-8555-555555555555','c3333333-3333-4333-8333-333333333333','rls-fixture-published',1,'completed',101); raise exception 'invalid hint count accepted'; exception when check_violation then null; end;
 begin insert into public.practice_attempts(owner_id,event_id,learner_id,lesson_id,lesson_version,outcome,received_at) values ('a1111111-1111-4111-8111-111111111111','e5555555-5555-4555-8555-555555555555','c3333333-3333-4333-8333-333333333333','rls-fixture-published',1,'completed',now()); raise exception 'client timestamp accepted'; exception when insufficient_privilege then null; end;
end $$;

reset role;
select set_config('request.jwt.claims','{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated","is_anonymous":false}',true);
set local role authenticated;
do $$ declare affected integer; begin
 assert (select count(*) from public.learner_profiles)=0, 'cross-owner profile leak';
 assert (select count(*) from public.practice_attempts)=0, 'cross-owner attempt leak';
 delete from public.practice_attempts; get diagnostics affected=row_count; assert affected=0, 'cross-owner deletion';
 delete from public.learner_profiles; get diagnostics affected=row_count; assert affected=0, 'cross-owner profile deletion';
 begin insert into public.learner_profiles(owner_id,learner_id) values ('a1111111-1111-4111-8111-111111111111','f6666666-6666-4666-8666-666666666666'); raise exception 'cross-owner profile insert'; exception when insufficient_privilege then null; end;
 begin insert into public.practice_attempts(owner_id,event_id,learner_id,lesson_id,lesson_version,outcome) values ('a1111111-1111-4111-8111-111111111111','f6666666-6666-4666-8666-666666666666','c3333333-3333-4333-8333-333333333333','rls-fixture-published',1,'completed'); raise exception 'cross-owner attempt insert'; exception when insufficient_privilege then null; end;
 begin insert into public.practice_attempts(owner_id,event_id,learner_id,lesson_id,lesson_version,outcome) values ('b2222222-2222-4222-8222-222222222222','f6666666-6666-4666-8666-666666666666','c3333333-3333-4333-8333-333333333333','rls-fixture-published',1,'completed'); raise exception 'cross-owner learner association'; exception when foreign_key_violation then null; end;
end $$;

reset role;
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ declare affected integer; begin
 delete from public.learner_profiles; get diagnostics affected=row_count; assert affected=1, 'own deletion failed';
 assert (select count(*) from public.practice_attempts)=0, 'learner deletion did not cascade';
end $$;
reset role;
rollback;
select 'PASS: anon restrictions, own CRUD subset, cross-owner isolation, immutable events, idempotency, bounds, protected timestamps, composite FK, cascade; all fixtures rolled back' as result,
 (select count(*) from auth.users where id in ('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222')) as remaining_test_users,
 (select count(*) from public.lesson_catalog where lesson_id like 'rls-fixture-%') as remaining_test_lessons;
