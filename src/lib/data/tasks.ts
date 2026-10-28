import type postgres from "postgres";
import { db } from "../db";
import { addDays, todayKyiv } from "../dates";
import { OPEN_TASK_STATUSES, type TaskInput, type TaskPatch, type TaskStatus } from "../schemas";
import type { Task, TaskWithSubject } from "../types";

export type DueFilter = "overdue" | "week" | "upcoming" | "none";
export type TaskSort = "due" | "subject" | "created";

export type TaskFilter = {
  subjectId?: string | null;
  statuses?: TaskStatus[];
  /** Лише незавершені (не розпочато / у процесі / доопрацювання). */
  openOnly?: boolean;
  due?: DueFilter;
  q?: string;
  /** due — найближчий дедлайн першим (за замовчуванням), subject — за предметом, created — нові першими. */
  sort?: TaskSort;
  limit?: number;
};

// jsonb-колонку треба передавати через sql.json, інакше масив піде як postgres-масив.
function toRow(sql: postgres.Sql, input: TaskInput | TaskPatch) {
  const { checklist, ...rest } = input;
  return checklist === undefined ? rest : { ...rest, checklist: sql.json(checklist) };
}

/** Найближче незаскасоване практичне чи лабораторне заняття предмета завдання, від сьогодні. */
const nextPractice = (sql: postgres.Sql, today: string) => sql`
  left join lateral (
    select c.date::text as next_practice_date, c.starts_at::text as next_practice_time
    from sh_class_sessions c
    where c.subject_id = t.subject_id and c.kind in ('practice', 'lab')
      and c.status = 'scheduled' and c.date >= ${today}
    order by c.date, c.starts_at nulls last
    limit 1
  ) np on true`;

export async function listTasks(filter: TaskFilter = {}): Promise<TaskWithSubject[]> {
  const sql = db();
  const today = todayKyiv();
  const where: postgres.PendingQuery<postgres.Row[]>[] = [];

  if (filter.subjectId) where.push(sql`t.subject_id = ${filter.subjectId}`);
  if (filter.statuses?.length) where.push(sql`t.status in ${sql(filter.statuses)}`);
  if (filter.openOnly) where.push(sql`t.status in ${sql([...OPEN_TASK_STATUSES])}`);
  if (filter.q) {
    const like = `%${filter.q}%`;
    where.push(sql`(t.title ilike ${like} or t.description ilike ${like} or t.source_text ilike ${like})`);
  }
  switch (filter.due) {
    case "overdue":
      where.push(sql`t.due_date < ${today} and t.status in ${sql([...OPEN_TASK_STATUSES])}`);
      break;
    case "week":
      where.push(sql`t.due_date between ${today} and ${addDays(today, 7)}`);
      break;
    case "upcoming":
      where.push(sql`t.due_date >= ${today}`);
      break;
    case "none":
      where.push(sql`t.due_date is null`);
      break;
  }

  const whereSql = where.length
    ? sql`where ${where.reduce((acc, part, i) => (i === 0 ? part : sql`${acc} and ${part}`))}`
    : sql``;

  return sql<TaskWithSubject[]>`
    select t.*, s.name as subject_name, np.next_practice_date, np.next_practice_time
    from sh_tasks t
    left join sh_subjects s on s.id = t.subject_id
    ${nextPractice(sql, today)}
    ${whereSql}
    order by ${
      filter.sort === "subject"
        ? sql`s.name asc nulls last, t.due_date asc nulls last, t.due_time asc nulls last`
        : filter.sort === "created"
          ? sql`t.created_at desc`
          : sql`t.due_date asc nulls last, t.due_time asc nulls last, t.created_at desc`
    }
    ${filter.limit ? sql`limit ${filter.limit}` : sql``}`;
}

export async function getTask(id: string): Promise<TaskWithSubject | null> {
  const sql = db();
  const [row] = await sql<TaskWithSubject[]>`
    select t.*, s.name as subject_name, np.next_practice_date, np.next_practice_time
    from sh_tasks t left join sh_subjects s on s.id = t.subject_id
    ${nextPractice(sql, todayKyiv())}
    where t.id = ${id}`;
  return row ?? null;
}

/** Схожі завдання (за назвою, у межах предмета, якщо його вказано) — перевірка на дублікати. */
export async function findSimilarTasks(title: string, subjectId?: string | null, limit = 5) {
  const sql = db();
  return sql<(TaskWithSubject & { score: number })[]>`
    select t.*, s.name as subject_name,
      greatest(similarity(t.title, ${title}), word_similarity(${title}, t.title)) as score
    from sh_tasks t left join sh_subjects s on s.id = t.subject_id
    where (t.title ilike ${"%" + title + "%"} or similarity(t.title, ${title}) > 0.25
           or word_similarity(${title}, t.title) > 0.5)
      ${subjectId ? sql`and t.subject_id = ${subjectId}` : sql``}
    order by score desc
    limit ${limit}`;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const sql = db();
  const [row] = await sql<Task[]>`insert into sh_tasks ${sql(toRow(sql, input))} returning *`;
  return row;
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task | null> {
  const sql = db();
  if (Object.keys(patch).length === 0) return getTask(id);
  const [row] = await sql<Task[]>`update sh_tasks set ${sql(toRow(sql, patch))} where id = ${id} returning *`;
  return row ?? null;
}

export async function deleteTask(id: string): Promise<void> {
  await db()`delete from sh_tasks where id = ${id}`;
}
