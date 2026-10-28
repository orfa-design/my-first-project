import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClassDays } from "@/components/classes";
import { ConfirmButton } from "@/components/confirm-button";
import { GradeList } from "@/components/grades";
import { Empty, Loading, Prose, Section, TaskList } from "@/components/ui";
import { listAssessments } from "@/lib/data/assessments";
import { listClasses } from "@/lib/data/classes";
import { getSemester } from "@/lib/data/semesters";
import { getSubject } from "@/lib/data/subjects";
import { listTasks } from "@/lib/data/tasks";
import { todayKyiv } from "@/lib/dates";
import { isUuid } from "@/lib/ids";
import { CONTROL_FORM_LABELS } from "@/lib/labels";
import { OPEN_TASK_STATUSES } from "@/lib/schemas";
import { deleteSubjectAction } from "../actions";

export default function SubjectPage({ params }: PageProps<"/subjects/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <SubjectDetails params={params} />
    </Suspense>
  );
}

async function SubjectDetails({ params }: { params: PageProps<"/subjects/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const subject = await getSubject(id);
  if (!subject) notFound();
  const [tasks, semester, classes, grades] = await Promise.all([
    listTasks({ subjectId: id }),
    subject.semester_id ? getSemester(subject.semester_id) : null,
    listClasses({ subjectId: id, from: todayKyiv() }),
    listAssessments({ subjectId: id }),
  ]);

  const isOpen = (s: string) => (OPEN_TASK_STATUSES as readonly string[]).includes(s);
  const open = tasks.filter((t) => isOpen(t.status));
  const submitted = tasks.filter((t) => t.status === "submitted");
  const completed = tasks.filter((t) => t.status === "completed");

  const facts = [
    subject.code && ["Код", subject.code],
    semester && ["Семестр", semester.name],
    subject.control_form && ["Контроль", CONTROL_FORM_LABELS[subject.control_form]],
    subject.teacher_name && ["Викладач", subject.teacher_name],
    subject.teacher_contacts && ["Контакти", subject.teacher_contacts],
  ].filter(Boolean) as [string, string][];

  return (
    <article>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{subject.name}</h1>
        <div className="flex gap-2">
          <Link href={`/subjects/${id}/edit`} className="btn-secondary">Редагувати</Link>
          <form action={deleteSubjectAction.bind(null, id)}>
            <ConfirmButton message="Видалити предмет? Завдання залишаться, але без предмета." className="btn-danger">
              Видалити
            </ConfirmButton>
          </form>
        </div>
      </header>

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

      <Section
        title="Найближчі заняття"
        count={classes.length}
        action={<Link href={`/schedule/new?subject=${id}`} className="text-sm text-accent">+ заняття</Link>}
      >
        {classes.length ? (
          <ClassDays classes={classes} showSubject={false} />
        ) : (
          <Empty>Запланованих занять немає.</Empty>
        )}
      </Section>

      <Section
        title="Потрібно зробити"
        count={open.length}
        action={<Link href={`/tasks/new?subject=${id}`} className="text-sm text-accent">+ завдання</Link>}
      >
        {open.length ? <TaskList tasks={open} showSubject={false} /> : <Empty>Незавершених завдань немає.</Empty>}
      </Section>

      {submitted.length > 0 && (
        <Section title="Здано, чекає оцінки" count={submitted.length}>
          <TaskList tasks={submitted} showSubject={false} />
        </Section>
      )}

      {completed.length > 0 && (
        <Section title="Зараховано" count={completed.length}>
          <TaskList tasks={completed} showSubject={false} />
        </Section>
      )}

      <Section
        title="Оцінки"
        count={grades.length}
        action={<Link href={`/grades/new?subject=${id}`} className="text-sm text-accent">+ оцінка</Link>}
      >
        {grades.length ? <GradeList grades={grades} showSubject={false} /> : <Empty>Оцінок ще немає.</Empty>}
      </Section>

      {subject.notes && (
        <Section title="Нотатки">
          <div className="card p-4"><Prose>{subject.notes}</Prose></div>
        </Section>
      )}
    </article>
  );
}
