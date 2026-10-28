import { db } from "../db";
import { addDays, daysBetween, todayKyiv } from "../dates";
import type { Semester, Subject, TaskWithSubject } from "../types";
import { getCurrentSemester } from "./semesters";
import { listTasks } from "./tasks";

export type SessionSubject = Pick<Subject, "id" | "name" | "control_form" | "admission_requirements"> & {
  total_tasks: number;
  open_tasks: number;
  awaiting_grade: number;
  /** Найближчий дедлайн серед незавершених завдань предмета. */
  next_due_date: string | null;
  next_due_time: string | null;
};

export type Dashboard = {
  today: string;
  semester: Semester | null;
  /** Днів до початку сесії; null, якщо дата сесії невідома або вже минула. */
  daysToSession: number | null;
  /** Сесія йде сьогодні (між датами початку й кінця включно). */
  sessionOngoing: boolean;
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
        select t.*, s.name as subject_name from sh_tasks t left join sh_subjects s on s.id = t.subject_id
        where t.needs_review order by t.updated_at desc limit 10`,
      sql<TaskWithSubject[]>`
        select t.*, s.name as subject_name from sh_tasks t left join sh_subjects s on s.id = t.subject_id
        where t.result is not null order by t.updated_at desc limit 5`,
      // Предмети поточного семестру (або всі, якщо семестр не задано): спершу з найближчим
      // дедлайном, далі з незавершеними завданнями без дати, решта за назвою.
      sql<SessionSubject[]>`
        select s.id, s.name, s.control_form, s.admission_requirements,
          count(t.id)::int as total_tasks,
          count(t.id) filter (where t.status in ('not_started', 'in_progress', 'needs_revision'))::int as open_tasks,
          count(t.id) filter (where t.status = 'submitted')::int as awaiting_grade,
          nd.due_date::text as next_due_date, nd.due_time::text as next_due_time
        from sh_subjects s
        left join sh_tasks t on t.subject_id = s.id
        left join lateral (
          select nt.due_date, nt.due_time from sh_tasks nt
          where nt.subject_id = s.id and nt.due_date is not null
            and nt.status in ('not_started', 'in_progress', 'needs_revision')
          order by nt.due_date, nt.due_time nulls last limit 1
        ) nd on true
        ${semester ? sql`where s.semester_id = ${semester.id}` : sql``}
        group by s.id, nd.due_date, nd.due_time
        order by nd.due_date nulls last, nd.due_time nulls last, open_tasks desc, s.name`,
      sql<{ subjects: number; tasks: number }[]>`
        select (select count(*) from sh_subjects)::int as subjects, (select count(*) from sh_tasks)::int as tasks`,
    ]);

  // Найближчі дедлайни: два тижні вперед, але щонайменше 5 записів, якщо вони є.
  const horizon = addDays(today, 14);
  const upcoming = upcomingAll.filter((t, i) => (t.due_date ?? "") <= horizon || i < 5).slice(0, 10);

  const sessionStart = semester?.session_starts_on;
  const sessionEnd = semester?.session_ends_on;
  const daysToSession = sessionStart && sessionStart >= today ? daysBetween(today, sessionStart) : null;
  const sessionOngoing = !!sessionStart && !!sessionEnd && sessionStart <= today && today <= sessionEnd;

  return {
    today,
    semester,
    daysToSession,
    sessionOngoing,
    overdue,
    upcoming,
    awaitingGrade,
    needsReview,
    recentResults,
    sessionSubjects,
    counts,
  };
}
