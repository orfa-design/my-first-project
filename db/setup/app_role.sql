-- Окремий користувач бази для Study Hub (виконати один раз у Supabase → SQL Editor,
-- після міграцій з db/migrations).
--
-- Навіщо: застосунок підключається не як postgres, а як studyhub_app зі своїм паролем.
-- Він має доступ лише до таблиць sh_* і не може змінювати їхню структуру, тож інші
-- застосунки в цьому проєкті Supabase залишаються недоторканими, а пароль postgres не змінюється.
--
-- Перед запуском замініть ЗАМІНІТЬ_НА_ПАРОЛЬ на згенерований пароль (лише літери й цифри).
-- Рядок підключення (Transaction pooler, порт 6543):
--   postgresql://studyhub_app.<project-ref>:<пароль>@<host>:6543/postgres

create role studyhub_app login password 'ЗАМІНІТЬ_НА_ПАРОЛЬ';
alter role studyhub_app set search_path = public, extensions;

grant usage on schema public, extensions to studyhub_app;
grant select, insert, update, delete on sh_semesters, sh_subjects, sh_tasks to studyhub_app;
-- Таблиці етапу 2 (002_schedule_assessments.sql) міграція відкриває для studyhub_app сама.
grant execute on function sh_touch_updated_at() to studyhub_app;

-- RLS увімкнено (див. міграцію), тож потрібні політики саме для цього користувача.
create policy studyhub_app_all on sh_semesters for all to studyhub_app using (true) with check (true);
create policy studyhub_app_all on sh_subjects for all to studyhub_app using (true) with check (true);
create policy studyhub_app_all on sh_tasks for all to studyhub_app using (true) with check (true);
