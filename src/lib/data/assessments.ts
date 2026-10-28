import { db } from "../db";
import type { AssessmentInput, AssessmentPatch } from "../schemas";
import type { Assessment, AssessmentWithSubject } from "../types";

export async function listAssessments(filter: { subjectId?: string | null; limit?: number } = {}) {
  const sql = db();
  return sql<AssessmentWithSubject[]>`
    select a.*, s.name as subject_name
    from sh_assessments a
    left join sh_subjects s on s.id = a.subject_id
    ${filter.subjectId ? sql`where a.subject_id = ${filter.subjectId}` : sql``}
    order by a.assessed_on desc nulls last, a.created_at desc
    ${filter.limit ? sql`limit ${filter.limit}` : sql``}`;
}

export async function getAssessment(id: string): Promise<AssessmentWithSubject | null> {
  const [row] = await db()<AssessmentWithSubject[]>`
    select a.*, s.name as subject_name
    from sh_assessments a left join sh_subjects s on s.id = a.subject_id
    where a.id = ${id}`;
  return row ?? null;
}

/** Схожі записи того самого предмета — перевірка на дублікати. */
export async function findSimilarAssessments(title: string, subjectId?: string | null, limit = 5) {
  const sql = db();
  return sql<(AssessmentWithSubject & { score_similarity: number })[]>`
    select a.*, s.name as subject_name,
      greatest(similarity(a.title, ${title}), word_similarity(${title}, a.title)) as score_similarity
    from sh_assessments a left join sh_subjects s on s.id = a.subject_id
    where (a.title ilike ${"%" + title + "%"} or similarity(a.title, ${title}) > 0.25
           or word_similarity(${title}, a.title) > 0.5)
      ${subjectId ? sql`and a.subject_id = ${subjectId}` : sql``}
    order by score_similarity desc
    limit ${limit}`;
}

export async function createAssessment(input: AssessmentInput): Promise<Assessment> {
  const sql = db();
  const [row] = await sql<Assessment[]>`insert into sh_assessments ${sql(input)} returning *`;
  return row;
}

export async function updateAssessment(id: string, patch: AssessmentPatch): Promise<Assessment | null> {
  if (Object.keys(patch).length === 0) return getAssessment(id);
  const sql = db();
  const [row] = await sql<Assessment[]>`update sh_assessments set ${sql(patch)} where id = ${id} returning *`;
  return row ?? null;
}

export async function deleteAssessment(id: string): Promise<void> {
  await db()`delete from sh_assessments where id = ${id}`;
}
