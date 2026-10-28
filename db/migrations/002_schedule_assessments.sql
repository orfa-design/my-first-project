-- Етап 2: заняття (розклад на конкретні дати) і журнал оцінювання.
-- Заочний розклад — це пари на конкретні дати, тому зберігаємо саме їх. Регулярний щотижневий
-- розклад (з правилом парних/непарних тижнів) додамо, коли знадобиться.

-- Заняття або подія контролю (екзамен, залік) на конкретну дату за київським часом.
create table sh_class_sessions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references sh_subjects (id) on delete set null,
  date date not null,
  starts_at time,
  ends_at time,
  kind text not null default 'other'
    check (kind in ('lecture', 'practice', 'lab', 'consultation', 'exam', 'credit', 'diff_credit', 'other')),
  teacher_name text,
  -- Аудиторія або посилання на онлайн-заняття.
  location text,
  -- Скасоване заняття лишається в розкладі, щоб було видно, що його не буде.
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  notes text,
  source_text text,
  source_url text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sh_class_sessions_date on sh_class_sessions (date, starts_at);
create index sh_class_sessions_subject on sh_class_sessions (subject_id);

-- Результат оцінювання: бал або текст («зараховано»). Відсутня оцінка ≠ нуль, тому score може бути null.
create table sh_assessments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references sh_subjects (id) on delete set null,
  task_id uuid references sh_tasks (id) on delete set null,
  class_session_id uuid references sh_class_sessions (id) on delete set null,
  title text not null,
  score numeric,
  max_score numeric,
  result_text text,
  assessed_on date,
  teacher_comment text,
  source_text text,
  source_url text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sh_assessments_subject on sh_assessments (subject_id);

create trigger sh_class_sessions_touch before update on sh_class_sessions for each row execute function sh_touch_updated_at();
create trigger sh_assessments_touch before update on sh_assessments for each row execute function sh_touch_updated_at();

alter table sh_class_sessions enable row level security;
alter table sh_assessments enable row level security;

-- Доступ для окремого користувача застосунку (db/setup/app_role.sql), якщо його створено.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'studyhub_app') then
    grant select, insert, update, delete on sh_class_sessions, sh_assessments to studyhub_app;
    create policy studyhub_app_all on sh_class_sessions for all to studyhub_app using (true) with check (true);
    create policy studyhub_app_all on sh_assessments for all to studyhub_app using (true) with check (true);
  end if;
end $$;
