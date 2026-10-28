import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Empty, Loading, PageHeader, Section, TaskList } from "@/components/ui";
import { getDashboard, type SessionSubject } from "@/lib/data/dashboard";
import { formatDate } from "@/lib/dates";
import { CONTROL_FORM_LABELS } from "@/lib/labels";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Огляд" />
      <Suspense fallback={<Loading />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  await connection();
  const d = await getDashboard();

  if (d.counts.subjects === 0 && d.counts.tasks === 0) {
    return (
      <Empty>
        Тут поки порожньо. Найпростіше почати з чату з Claude: надішліть список предметів або оголошення
        викладача, і він створить записи. Або додайте{" "}
        <Link href="/semesters/new" className="text-accent underline">семестр</Link> і{" "}
        <Link href="/subjects/new" className="text-accent underline">предмет</Link> вручну.
      </Empty>
    );
  }

  return (
    <>
      <SessionBlock d={d} />

      {d.overdue.length > 0 && (
        <Section title="Прострочено" count={d.overdue.length}>
          <TaskList tasks={d.overdue} />
        </Section>
      )}

      <Section
        title="Найближчі дедлайни"
        count={d.upcoming.length}
        action={<Link href="/tasks?due=upcoming" className="text-sm text-accent">усі →</Link>}
      >
        {d.upcoming.length ? <TaskList tasks={d.upcoming} /> : <Empty>Найближчих дедлайнів немає.</Empty>}
      </Section>

      {d.awaitingGrade.length > 0 && (
        <Section title="Здано, чекає оцінки" count={d.awaitingGrade.length}>
          <TaskList tasks={d.awaitingGrade} />
        </Section>
      )}

      {d.needsReview.length > 0 && (
        <Section title="Перевірити дані від AI" count={d.needsReview.length}>
          <TaskList tasks={d.needsReview} />
        </Section>
      )}

      {d.recentResults.length > 0 && (
        <Section title="Останні результати">
          <TaskList tasks={d.recentResults} />
        </Section>
      )}
    </>
  );
}

function SessionBlock({ d }: { d: Awaited<ReturnType<typeof getDashboard>> }) {
  const subjects = d.sessionSubjects;
  const totalOpen = subjects.reduce((n, s) => n + s.open_tasks, 0);
  const sem = d.semester;

  return (
    <Section title="Сесія і предмети">
      <div className="card p-4">
        <p className="mb-3 text-sm">
          {sem ? (
            d.daysToSession !== null ? (
              <>
                Сесія з <b>{formatDate(sem.session_starts_on!)}</b> — через <b>{d.daysToSession} дн.</b>{" "}
              </>
            ) : d.sessionOngoing ? (
              <>
                Сесія триває до <b>{formatDate(sem.session_ends_on!)}</b>.{" "}
              </>
            ) : sem.session_starts_on ? (
              <>Сесія вже минула. </>
            ) : (
              <>
                Дата сесії невідома —{" "}
                <Link href={`/semesters/${sem.id}`} className="text-accent underline">додайте її</Link>.{" "}
              </>
            )
          ) : (
            <>
              Поточний семестр не задано —{" "}
              <Link href="/semesters/new" className="text-accent underline">додайте його</Link>, щоб бачити відлік до сесії.{" "}
            </>
          )}
          <span className="text-muted">Відкритих завдань: {totalOpen}.</span>
        </p>
        {subjects.length > 0 ? (
          <ul className="divide-y divide-border text-sm">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-4 py-2">
                <Link href={`/subjects/${s.id}`} className="min-w-0 font-medium hover:text-accent">
                  {s.name}
                  {s.control_form && <span className="ml-2 font-normal text-muted">{CONTROL_FORM_LABELS[s.control_form]}</span>}
                </Link>
                <span className="shrink-0 text-right">
                  <SubjectStatus s={s} />
                  {s.awaiting_grade > 0 && <span className="text-muted"> · {s.awaiting_grade} чекає оцінки</span>}
                  {s.admission_requirements && <span className="text-muted"> · є вимоги до допуску</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Предметів поточного семестру ще немає.</p>
        )}
      </div>
    </Section>
  );
}

function SubjectStatus({ s }: { s: SessionSubject }) {
  if (s.open_tasks === 0) {
    // Без жодного завдання — не «усе здано»: здавати просто нічого не записано.
    return <span className="text-muted">{s.total_tasks ? "усе здано" : "завдань немає"}</span>;
  }
  if (!s.next_due_date) return <span className="text-muted">відкритих: {s.open_tasks}, без дати</span>;
  return (
    <>
      {formatDate(s.next_due_date)}
      {s.next_due_time && `, ${s.next_due_time.slice(0, 5)}`}
      {s.open_tasks > 1 && <span className="text-muted"> · відкритих: {s.open_tasks}</span>}
    </>
  );
}
