-- «Я беру це»: той, хто вибирає подарунок, бронює бажання на публічній сторінці,
-- щоб інші бачили, що його вже хтось бере. reserved_by — випадковий ідентифікатор
-- браузера (cookie), лише він може скасувати бронь. Власниці список броней не показується.
alter table wl_items add column if not exists reserved_at timestamptz;
alter table wl_items add column if not exists reserved_by text;
