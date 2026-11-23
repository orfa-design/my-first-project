-- Посилання на сторінку події (квитки, афіша) — показується в календарі кнопкою «Сторінка події».
alter table cal_events add column if not exists url text;
