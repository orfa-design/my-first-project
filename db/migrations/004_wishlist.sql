-- Вішліст: окремий підпроєкт на тому ж сайті. Публічна сторінка /w/<share_token> відкривається
-- без пароля і показує лише цей список; редагування — за паролем (/wishlist) або через CLI.

create table wl_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  intro text,
  -- Випадковий ключ публічного посилання; змінити його — і старе посилання перестане працювати.
  share_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wl_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references wl_lists (id) on delete cascade,
  title text not null,
  url text,
  price text,
  note text,
  priority text check (priority in ('low', 'normal', 'high')),
  -- Приховане бажання не видно за публічним посиланням.
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wl_items_list on wl_items (list_id);

create trigger wl_lists_touch before update on wl_lists for each row execute function sh_touch_updated_at();
create trigger wl_items_touch before update on wl_items for each row execute function sh_touch_updated_at();

alter table wl_lists enable row level security;
alter table wl_items enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'studyhub_app') then
    grant select, insert, update, delete on wl_lists, wl_items to studyhub_app;
    create policy studyhub_app_all on wl_lists for all to studyhub_app using (true) with check (true);
    create policy studyhub_app_all on wl_items for all to studyhub_app using (true) with check (true);
  end if;
end $$;

-- Перший список із наперед відомим посиланням, щоб ним можна було поділитися ще до наповнення.
insert into wl_lists (title, share_token) values ('Мій вішліст', 'unrpenecqssn');
