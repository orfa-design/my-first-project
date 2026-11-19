-- Особистий календар: події (разові, регулярні, події інших людей), афіші до них і список справ.
-- Сторінка /calendar — за паролем, як і решта сайту.

create table cal_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- Чия подія: 'mine' — моя, 'other' — подія іншої людини (її ім'я — у person).
  owner text not null default 'mine' check (owner in ('mine', 'other')),
  person text,
  -- Дата разової події; для регулярної — з якого дня повторюється.
  date date not null,
  -- Без часу — подія на весь день.
  time time,
  place text,
  note text,
  -- Регулярна подія: дні тижня (1 — пн … 7 — нд) і до якої дати включно (null — безстроково).
  weekdays smallint[] check (weekdays is null or (cardinality(weekdays) > 0 and weekdays <@ '{1,2,3,4,5,6,7}')),
  repeat_until date,
  -- Пропущені повторення регулярної події (наприклад, у свято).
  skipped_dates date[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cal_events_date on cal_events (date);

-- Афіша чи інша картинка до події. Окремо від подій, щоб списки не тягнули байти картинок.
create table cal_posters (
  event_id uuid primary key references cal_events (id) on delete cascade,
  mime text not null,
  data bytea not null,
  updated_at timestamptz not null default now()
);

-- Справи без дати. Виконана лишається закресленою до кінця дня (за Києвом), потім ховається.
create table cal_todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create trigger cal_events_touch before update on cal_events for each row execute function sh_touch_updated_at();

alter table cal_events enable row level security;
alter table cal_posters enable row level security;
alter table cal_todos enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'studyhub_app') then
    grant select, insert, update, delete on cal_events, cal_posters, cal_todos to studyhub_app;
    create policy studyhub_app_all on cal_events for all to studyhub_app using (true) with check (true);
    create policy studyhub_app_all on cal_posters for all to studyhub_app using (true) with check (true);
    create policy studyhub_app_all on cal_todos for all to studyhub_app using (true) with check (true);
  end if;
end $$;

-- Перші записи.
insert into cal_events (title, date, time) values
  ('Танці', '2026-11-21', '09:00'),
  ('Майстер-клас', '2026-11-21', '16:00'),
  ('Кіно', '2026-11-21', '19:15');
insert into cal_events (title, date, time, weekdays) values ('Танці', '2026-11-19', '19:30', '{1,5}');
insert into cal_events (title, owner, person, date) values ('Переведення', 'other', 'Андрій', '2026-12-05');
insert into cal_todos (title) values ('купити яйця');
