-- Публічне посилання на розклад Study Hub: /s/<token> відкривається без пароля, лише для перегляду
-- (розклад, заняття, предмети, завдання — без оцінок, нотаток і джерел).
create table if not exists sh_share_links (
  -- Що відкриває посилання; поки лише 'schedule'.
  kind text primary key,
  -- Випадковий ключ; змінити його — і старе посилання перестане працювати.
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table sh_share_links enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'studyhub_app') then
    grant select, insert, update, delete on sh_share_links to studyhub_app;
    create policy studyhub_app_all on sh_share_links for all to studyhub_app using (true) with check (true);
  end if;
end $$;

insert into sh_share_links (kind, token)
values ('schedule', substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
on conflict (kind) do nothing;
