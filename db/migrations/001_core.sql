-- Етап 1: семестри, предмети, завдання.

create extension if not exists pg_trgm;

-- Семестр задає межі навчального періоду та дати сесії.
-- Від них рахується блок «Що залишилося закрити до сесії».
create table semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date,
  ends_on date,
  session_starts_on date,
  session_ends_on date,
  is_current boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Поточним може бути лише один семестр.
create unique index semesters_one_current on semesters (is_current) where is_current;

create table subjects (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references semesters (id) on delete set null,
  name text not null,
  code text,
  teacher_name text,
  teacher_contacts text,
  -- Форма підсумкового контролю: exam | credit | diff_credit | other.
  control_form text check (control_form in ('exam', 'credit', 'diff_credit', 'other')),
  -- Як оцінюють предмет — довільний текст, бо правила в кожного викладача свої.
  grading_rules text,
  -- Що потрібно для допуску до заліку/екзамену.
  admission_requirements text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subjects_name_trgm on subjects using gin (name gin_trgm_ops);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects (id) on delete set null,
  title text not null,
  description text,
  -- Дедлайн за київським часом: дата обов'язкова для дедлайну, час — ні.
  due_date date,
  due_time time,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'submitted', 'completed', 'needs_revision')),
  priority text check (priority in ('low', 'normal', 'high')),
  submission_info text,
  -- Короткий результат («18/20», «зараховано»). Детальний журнал оцінювання — етап 2.
  result text,
  -- [{ "text": "...", "done": false }]
  checklist jsonb not null default '[]'::jsonb,
  -- Оригінальний текст повідомлення/оголошення, з якого створено завдання.
  source_text text,
  source_url text,
  -- AI не впевнений у частині даних — варто перевірити.
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_subject on tasks (subject_id);
create index tasks_due on tasks (due_date);
create index tasks_title_trgm on tasks using gin (title gin_trgm_ops);

create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger semesters_touch before update on semesters for each row execute function touch_updated_at();
create trigger subjects_touch before update on subjects for each row execute function touch_updated_at();
create trigger tasks_touch before update on tasks for each row execute function touch_updated_at();
