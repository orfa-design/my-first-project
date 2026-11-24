-- Події на кілька днів (поїздка, відпустка): кінцева дата й, за бажанням, час завершення.
-- Така подія стоїть у списку один раз — у день початку, а поки триває, «Сьогодні» показує смужку «день N з M».
alter table cal_events add column if not exists end_date date;
alter table cal_events add column if not exists end_time time;
