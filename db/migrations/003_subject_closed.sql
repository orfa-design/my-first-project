-- Предмет «закрито»: залік чи екзамен уже складено, пари можна не відвідувати.
-- Такий предмет приглушується в розкладі й на головній; його дані лишаються.
alter table sh_subjects add column if not exists is_closed boolean not null default false;
