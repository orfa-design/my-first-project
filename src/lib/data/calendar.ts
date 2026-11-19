import type postgres from "postgres";
import { db } from "../db";
import type { CalEventInput, CalEventPatch } from "../schemas";
import type { CalEvent, CalTodo } from "../types";

// Особистий календар: події, афіші, справи.

const columns = (sql: postgres.Sql) => sql`
  e.id, e.title, e.owner, e.person, e.date, e.time, e.place, e.note, e.weekdays, e.repeat_until,
  e.skipped_dates::text[] as skipped_dates,
  exists (select 1 from cal_posters p where p.event_id = e.id) as has_poster,
  (select extract(epoch from p.updated_at)::bigint::text from cal_posters p where p.event_id = e.id) as poster_version,
  e.created_at, e.updated_at`;

export async function listEvents(): Promise<CalEvent[]> {
  const sql = db();
  return sql<CalEvent[]>`select ${columns(sql)} from cal_events e order by e.date, e.time nulls first`;
}

export async function getEvent(id: string): Promise<CalEvent | null> {
  const sql = db();
  const [row] = await sql<CalEvent[]>`select ${columns(sql)} from cal_events e where e.id = ${id}`;
  return row ?? null;
}

export async function createEvent(input: CalEventInput): Promise<CalEvent> {
  const sql = db();
  const [{ id }] = await sql<{ id: string }[]>`insert into cal_events ${sql(input)} returning id`;
  return (await getEvent(id))!;
}

export async function updateEvent(id: string, patch: CalEventPatch): Promise<CalEvent | null> {
  if (Object.keys(patch).length) {
    const sql = db();
    await sql`update cal_events set ${sql(patch)} where id = ${id}`;
  }
  return getEvent(id);
}

export async function deleteEvent(id: string): Promise<void> {
  await db()`delete from cal_events where id = ${id}`;
}

/** Пропустити одне повторення регулярної події. */
export async function skipOccurrence(id: string, date: string): Promise<CalEvent | null> {
  await db()`
    update cal_events set skipped_dates = array_append(skipped_dates, ${date}::date)
    where id = ${id} and weekdays is not null and not (${date}::date = any (skipped_dates))`;
  return getEvent(id);
}

/** Повернути пропущене повторення. */
export async function unskipOccurrence(id: string, date: string): Promise<CalEvent | null> {
  await db()`update cal_events set skipped_dates = array_remove(skipped_dates, ${date}::date) where id = ${id}`;
  return getEvent(id);
}

export async function setPoster(eventId: string, mime: string, data: Buffer): Promise<void> {
  await db()`
    insert into cal_posters (event_id, mime, data) values (${eventId}, ${mime}, ${data})
    on conflict (event_id) do update set mime = excluded.mime, data = excluded.data, updated_at = now()`;
}

export async function removePoster(eventId: string): Promise<void> {
  await db()`delete from cal_posters where event_id = ${eventId}`;
}

export async function getPoster(eventId: string): Promise<{ mime: string; data: Buffer } | null> {
  const [row] = await db()<{ mime: string; data: Buffer }[]>`select mime, data from cal_posters where event_id = ${eventId}`;
  return row ?? null;
}

/** Справи: невиконані й виконані сьогодні (за Києвом) — ті лишаються закресленими до кінця дня. */
export async function listTodos(today: string): Promise<CalTodo[]> {
  return db()<CalTodo[]>`
    select * from cal_todos
    where done_at is null or (done_at at time zone 'Europe/Kyiv')::date = ${today}::date
    order by (done_at is not null), created_at`;
}

export async function addTodo(title: string): Promise<CalTodo> {
  const [row] = await db()<CalTodo[]>`insert into cal_todos (title) values (${title}) returning *`;
  return row;
}

export async function setTodoDone(id: string, done: boolean): Promise<CalTodo | null> {
  const [row] = await db()<CalTodo[]>`
    update cal_todos set done_at = ${done ? db()`now()` : null} where id = ${id} returning *`;
  return row ?? null;
}

export async function updateTodo(id: string, title: string): Promise<CalTodo | null> {
  const [row] = await db()<CalTodo[]>`update cal_todos set title = ${title} where id = ${id} returning *`;
  return row ?? null;
}

export async function deleteTodo(id: string): Promise<void> {
  await db()`delete from cal_todos where id = ${id}`;
}
