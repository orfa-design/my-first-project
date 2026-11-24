-- Місце без посилання на Google Карти («на кухні», «вдома»): показується звичайним текстом.
alter table cal_events add column if not exists place_no_map boolean not null default false;
