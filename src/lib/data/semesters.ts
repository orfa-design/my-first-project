import { db } from "../db";
import type { SemesterInput, SemesterPatch } from "../schemas";
import type { Semester } from "../types";

export async function listSemesters(): Promise<Semester[]> {
  return db()<Semester[]>`select * from semesters order by starts_on desc nulls last, created_at desc`;
}

export async function getSemester(id: string): Promise<Semester | null> {
  const [row] = await db()<Semester[]>`select * from semesters where id = ${id}`;
  return row ?? null;
}

export async function getCurrentSemester(): Promise<Semester | null> {
  const [row] = await db()<Semester[]>`select * from semesters where is_current`;
  return row ?? null;
}

export async function createSemester(input: SemesterInput): Promise<Semester> {
  return db().begin(async (sql) => {
    if (input.is_current) await sql`update semesters set is_current = false where is_current`;
    const [row] = await sql<Semester[]>`insert into semesters ${sql(input)} returning *`;
    return row;
  }) as Promise<Semester>;
}

export async function updateSemester(id: string, patch: SemesterPatch): Promise<Semester | null> {
  if (Object.keys(patch).length === 0) return getSemester(id);
  return db().begin(async (sql) => {
    if (patch.is_current) await sql`update semesters set is_current = false where is_current and id <> ${id}`;
    const [row] = await sql<Semester[]>`update semesters set ${sql(patch)} where id = ${id} returning *`;
    return row ?? null;
  }) as Promise<Semester | null>;
}

export async function deleteSemester(id: string): Promise<void> {
  await db()`delete from semesters where id = ${id}`;
}
