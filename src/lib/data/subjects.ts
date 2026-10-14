import { db } from "../db";
import type { SubjectInput, SubjectPatch } from "../schemas";
import type { Subject } from "../types";

export type SubjectWithCounts = Subject & { open_tasks: number; total_tasks: number };

export async function listSubjects(semesterId?: string | null): Promise<SubjectWithCounts[]> {
  const sql = db();
  return sql<SubjectWithCounts[]>`
    select s.*,
      count(t.id) filter (where t.status in ('not_started', 'in_progress', 'needs_revision'))::int as open_tasks,
      count(t.id)::int as total_tasks
    from subjects s
    left join tasks t on t.subject_id = s.id
    ${semesterId ? sql`where s.semester_id = ${semesterId}` : sql``}
    group by s.id
    order by s.name`;
}

export async function getSubject(id: string): Promise<Subject | null> {
  const [row] = await db()<Subject[]>`select * from subjects where id = ${id}`;
  return row ?? null;
}

/** Схожі за назвою предмети — щоб AI не створював дублікати («Економіка» vs «економіка підприємства»). */
export async function findSimilarSubjects(name: string, limit = 5) {
  return db()<(Subject & { score: number })[]>`
    select *, greatest(similarity(name, ${name}), word_similarity(${name}, name)) as score
    from subjects
    where name ilike ${"%" + name + "%"} or similarity(name, ${name}) > 0.2 or word_similarity(${name}, name) > 0.4
    order by score desc
    limit ${limit}`;
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const sql = db();
  const [row] = await sql<Subject[]>`insert into subjects ${sql(input)} returning *`;
  return row;
}

export async function updateSubject(id: string, patch: SubjectPatch): Promise<Subject | null> {
  if (Object.keys(patch).length === 0) return getSubject(id);
  const sql = db();
  const [row] = await sql<Subject[]>`update subjects set ${sql(patch)} where id = ${id} returning *`;
  return row ?? null;
}

export async function deleteSubject(id: string): Promise<void> {
  await db()`delete from subjects where id = ${id}`;
}
