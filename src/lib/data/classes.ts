import type postgres from "postgres";
import { db } from "../db";
import type { ClassKind, ClassSessionInput, ClassSessionPatch } from "../schemas";
import type { ClassSession, ClassSessionWithSubject } from "../types";

export type ClassFilter = {
  subjectId?: string | null;
  /** Включно, YYYY-MM-DD. */
  from?: string;
  to?: string;
  kinds?: ClassKind[];
  /** Без скасованих. */
  activeOnly?: boolean;
  limit?: number;
};

/** Лічильники завдань предмета заняття: незавершені, здані без оцінки, зараховані. */
const taskCounts = (sql: postgres.Sql) => sql`
  (select count(*) from sh_tasks t
   where t.subject_id = c.subject_id and t.status in ('not_started', 'in_progress', 'needs_revision'))::int
    as subject_open_tasks,
  (select count(*) from sh_tasks t where t.subject_id = c.subject_id and t.status = 'submitted')::int
    as subject_submitted_tasks,
  (select count(*) from sh_tasks t where t.subject_id = c.subject_id and t.status = 'completed')::int
    as subject_completed_tasks`;

export async function listClasses(filter: ClassFilter = {}): Promise<ClassSessionWithSubject[]> {
  const sql = db();
  const where: postgres.PendingQuery<postgres.Row[]>[] = [];
  if (filter.subjectId) where.push(sql`c.subject_id = ${filter.subjectId}`);
  if (filter.from) where.push(sql`c.date >= ${filter.from}`);
  if (filter.to) where.push(sql`c.date <= ${filter.to}`);
  if (filter.kinds?.length) where.push(sql`c.kind in ${sql(filter.kinds)}`);
  if (filter.activeOnly) where.push(sql`c.status = 'scheduled'`);

  const whereSql = where.length
    ? sql`where ${where.reduce((acc, part, i) => (i === 0 ? part : sql`${acc} and ${part}`))}`
    : sql``;

  return sql<ClassSessionWithSubject[]>`
    select c.*, s.name as subject_name, ${taskCounts(sql)}
    from sh_class_sessions c
    left join sh_subjects s on s.id = c.subject_id
    ${whereSql}
    order by c.date, c.starts_at nulls last, s.name
    ${filter.limit ? sql`limit ${filter.limit}` : sql``}`;
}

export async function getClass(id: string): Promise<ClassSessionWithSubject | null> {
  const sql = db();
  const [row] = await sql<ClassSessionWithSubject[]>`
    select c.*, s.name as subject_name, ${taskCounts(sql)}
    from sh_class_sessions c left join sh_subjects s on s.id = c.subject_id
    where c.id = ${id}`;
  return row ?? null;
}

/** Заняття того самого предмета в ту саму дату й час — найімовірніше дублікат. */
export async function findDuplicateClasses(input: Pick<ClassSessionInput, "subject_id" | "date" | "starts_at">) {
  const sql = db();
  return sql<ClassSessionWithSubject[]>`
    select c.*, s.name as subject_name, ${taskCounts(sql)}
    from sh_class_sessions c left join sh_subjects s on s.id = c.subject_id
    where c.date = ${input.date}
      and c.starts_at is not distinct from ${input.starts_at ?? null}::time
      and c.subject_id is not distinct from ${input.subject_id ?? null}::uuid`;
}

export async function createClass(input: ClassSessionInput): Promise<ClassSession> {
  const sql = db();
  const [row] = await sql<ClassSession[]>`insert into sh_class_sessions ${sql(input)} returning *`;
  return row;
}

export async function updateClass(id: string, patch: ClassSessionPatch): Promise<ClassSession | null> {
  if (Object.keys(patch).length === 0) return getClass(id);
  const sql = db();
  const [row] = await sql<ClassSession[]>`update sh_class_sessions set ${sql(patch)} where id = ${id} returning *`;
  return row ?? null;
}

export async function deleteClass(id: string): Promise<void> {
  await db()`delete from sh_class_sessions where id = ${id}`;
}

/** Дата першого заняття в майбутньому (від сьогодні) — щоб розклад відкривався на ньому. */
export async function nextClassDate(today: string): Promise<string | null> {
  const [row] = await db()<{ date: string }[]>`
    select date from sh_class_sessions where date >= ${today} and status = 'scheduled' order by date limit 1`;
  return row?.date ?? null;
}
