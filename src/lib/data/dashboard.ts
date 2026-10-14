import { db } from "../db";
import { addDays, daysBetween, todayKyiv } from "../dates";
import type { Semester, Subject, TaskWithSubject } from "../types";
import { getCurrentSemester } from "./semesters";
import { listTasks } from "./tasks";

export type SessionSubject = Pick<Subject, "id" | "name" | "control_form" | "admission_requirements"> & {
  open_tasks: number;
  awaiting_grade: number;
};

export type Dashboard = {
  today: string;
  semester: Semester | null;
  /** Днів до початку сесії; null, якщо дата сесії невідома або вже минула. */
  daysToSession: number | null;
  overdue: TaskWithSubject[];
  upcoming: TaskWithSubject[];
  awaitingGrade: TaskWithSubject[];
  needsReview: TaskWithSubject[];
  recentResults: TaskWithSubject[];
  sessionSubjects: SessionSubject[];
  counts: { subjects: number; tasks: number };
};

export async function getDashboard(): Promise<Dashboard> {
  const sql = db();
  const today = todayKyiv();
  const semester = await getCurrentSemester();

  const [overdue, upcomingAll, awaitingGrade, needsReview, recentResults, sessionSubjects, [counts]] =
    await Promise.all([
      listTasks({ due: "overdue" }),
      listTasks({ openOnly: true, due: "upcoming" }),
      listTasks({ statuses: ["submitted"] }),
      sql<TaskWithSubject[]>`
        select t.*, s.name as subject_name from tasks t left join subjects s on s.id = t.subject_id
        where t.needs_review order by t.updated_at desc limit 10`,
      sql<TaskWithSubject[]>`
        select t.*, s.name as subject_name from tasks t left join subjects s on s.id = t.subject_id
        where t.result is not null order by t.updated_at desc limit 5`,
      // Що залишилося до сесії: предмети поточного семестру (або всі, якщо семестр не задано).
      sql<SessionSubject[]>`
        select s.id, s.name, s.control_form, s.admission_requirements,
          count(t.id) filter (where t.status in ('not_started', 'in_progress', 'needs_revision'))::int as open_tasks,
          count(t.id) filter (where t.status = 'submitted')::int as awaiting_grade
        from subjects s left join tasks t on t.subject_id = s.id
        ${semester ? sql`where s.semester_id = ${semester.id}` : sql``}
        group by s.id
        order by open_tasks desc, s.name`,
      sql<{ subjects: number; tasks: number }[]>`
        select (select count(*) from subjects)::int as subjects, (select count(*) from tasks)::int as tasks`,
    ]);

  // Найближчі дедлайни: два тижні вперед, але щонайменше 5 записів, якщо вони є.
  const horizon = addDays(today, 14);
  const upcoming = upcomingAll.filter((t, i) => (t.due_date ?? "") <= horizon || i < 5).slice(0, 10);

  const sessionStart = semester?.session_starts_on;
  const daysToSession = sessionStart && sessionStart >= today ? daysBetween(today, sessionStart) : null;

  return {
    today,
    semester,
    daysToSession,
    overdue,
    upcoming,
    awaitingGrade,
    needsReview,
    recentResults,
    sessionSubjects,
    counts,
  };
}
