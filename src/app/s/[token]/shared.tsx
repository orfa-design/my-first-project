import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassDays } from "@/components/classes";
import { Empty, Prose, Section, TaskList } from "@/components/ui";
import { listClasses } from "@/lib/data/classes";
import { getSemester } from "@/lib/data/semesters";
import { isScheduleToken } from "@/lib/data/share";
import { listTasks } from "@/lib/data/tasks";
import { todayKyiv } from "@/lib/dates";
import { CONTROL_FORM_LABELS } from "@/lib/labels";
import { OPEN_TASK_STATUSES } from "@/lib/schemas";
import type { Subject } from "@/lib/types";

/** Адреси публічних сторінок розкладу. */
export const publicHref = (token: string) => ({
  schedule: (week?: string) => `/s/${token}${week ? `?week=${week}` : ""}`,
  class: (id: string) => `/s/${token}/class/${id}`,
  subject: (id: string) => `/s/${token}/subject/${id}`,
  task: (id: string) => `/s/${token}/task/${id}`,
});

/** 404, якщо ключ не той: сторінка не повинна підказувати, що посилання колись існувало. */
export async function requireScheduleToken(token: string): Promise<void> {
  if (!(await isScheduleToken(token))) notFound();
}

export function PublicBadge() {
  return <span className="shrink-0 whitespace-nowrap rounded bg-surface-muted px-2 py-0.5 text-xs text-muted">лише перегляд</span>;
}

/** Про предмет для публічного перегляду: викладач, вимоги, заняття, завдання. Без оцінок і нотаток. */
export async function PublicSubjectOverview({ subject, token, currentClassId }: { subject: Subject; token: string; currentClassId?: string }) {
  const href = publicHref(token);
  const [tasks, semester, classes] = await Promise.all([
    listTasks({ subjectId: subject.id }),
    subject.semester_id ? getSemester(subject.semester_id) : null,
    listClasses({ subjectId: subject.id, from: todayKyiv() }),
  ]);
  const isOpen = (s: string) => (OPEN_TASK_STATUSES as readonly string[]).includes(s);
  const open = tasks.filter((t) => isOpen(t.status));
  const done = tasks.filter((t) => !isOpen(t.status));

  const facts = [
    subject.code && ["Код", subject.code],
    semester && ["Семестр", semester.name],
    subject.control_form && ["Контроль", CONTROL_FORM_LABELS[subject.control_form]],
    subject.teacher_name && ["Викладач", subject.teacher_name],
    subject.teacher_contacts && ["Контакти", subject.teacher_contacts],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      {subject.is_closed && (
        <p className="card mb-4 bg-ok-soft p-3 text-sm text-ok">✓ Предмет уже закрито (залік чи екзамен складено).</p>
      )}

      {facts.length > 0 && (
        <dl className="card mb-8 grid gap-x-6 gap-y-2 p-4 text-sm sm:grid-cols-[auto_1fr]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="whitespace-pre-wrap">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {(subject.admission_requirements || subject.grading_rules) && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {subject.admission_requirements && (
            <div className="card p-4">
              <h2 className="mb-2 text-sm font-semibold">Допуск до сесії</h2>
              <Prose>{subject.admission_requirements}</Prose>
            </div>
          )}
          {subject.grading_rules && (
            <div className="card p-4">
              <h2 className="mb-2 text-sm font-semibold">Вимоги до оцінювання</h2>
              <Prose>{subject.grading_rules}</Prose>
            </div>
          )}
        </div>
      )}

      <Section title="Найближчі заняття" count={classes.length}>
        {classes.length ? (
          <ClassDays classes={classes} showSubject={false} currentId={currentClassId} view={{ hrefFor: href.class, publicView: true }} />
        ) : (
          <Empty>Запланованих занять немає.</Empty>
        )}
      </Section>

      <Section title="Завдання" count={open.length}>
        {open.length ? <TaskList tasks={open} showSubject={false} hrefFor={href.task} readOnly /> : <Empty>Відкритих завдань немає.</Empty>}
      </Section>

      {done.length > 0 && (
        <Section title="Вже здано" count={done.length}>
          <TaskList tasks={done} showSubject={false} hrefFor={href.task} readOnly />
        </Section>
      )}

      <p className="mt-10 text-center text-sm">
        <Link href={href.schedule()} className="text-accent">← До розкладу</Link>
      </p>
    </>
  );
}
