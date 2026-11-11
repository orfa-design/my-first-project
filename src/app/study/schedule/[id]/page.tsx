import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { KindBadge, timeRange } from "@/components/classes";
import { SubjectOverview } from "@/components/subject-overview";
import { Loading, Prose } from "@/components/ui";
import { saveClassNoteAction } from "../actions";
import { getClass } from "@/lib/data/classes";
import { getSubject } from "@/lib/data/subjects";
import { formatDate, relativeDue } from "@/lib/dates";
import { isUuid } from "@/lib/ids";

export default function ClassPage({ params }: PageProps<"/study/schedule/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <ClassDetails params={params} />
    </Suspense>
  );
}

/** Перегляд пари: сама пара зверху, нижче — усе про предмет (як на сторінці предмета). */
async function ClassDetails({ params }: { params: PageProps<"/study/schedule/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const session = await getClass(id);
  if (!session) notFound();
  const subject = session.subject_id ? await getSubject(session.subject_id) : null;
  const cancelled = session.status === "cancelled";

  return (
    <article>
      <div className="mb-1 text-sm">
        <Link href={`/study/schedule?week=${session.date}`} className="text-accent">← Розклад</Link>
      </div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {subject ? (
              <Link href={`/study/subjects/${subject.id}`} className="hover:text-accent">{subject.name}</Link>
            ) : (
              "Без предмета"
            )}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <KindBadge kind={session.kind} />
            <span className={cancelled ? "text-muted line-through" : "font-medium"}>
              {formatDate(session.date)}
              {timeRange(session) && `, ${timeRange(session)}`}
            </span>
            <span className="text-muted">{relativeDue(session.date)}</span>
            {cancelled && <span className="text-danger">скасовано</span>}
            {session.teacher_name && <span className="text-muted">{session.teacher_name}</span>}
            {session.location && <span className="text-muted">{session.location}</span>}
          </div>
        </div>
        <Link href={`/study/schedule/${id}/edit`} className="btn-secondary">Редагувати</Link>
      </header>

      {session.needs_review && (
        <p className="mb-6 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          AI позначив, що частина даних про це заняття може бути неточною.
        </p>
      )}
      <form action={saveClassNoteAction.bind(null, id)} className="card mb-8 space-y-2 p-4">
        <label htmlFor="class-note" className="text-sm font-semibold">Моя нотатка до пари</label>
        <textarea
          id="class-note"
          name="notes"
          rows={2}
          defaultValue={session.notes ?? ""}
          placeholder="Наприклад: можна не ходити, принести ноутбук, перенесли в іншу аудиторію…"
          className="input"
        />
        <button className="btn-secondary">Зберегти нотатку</button>
      </form>

      {subject && <SubjectOverview subject={subject} currentClassId={session.id} />}

      {(session.source_text || session.source_url) && (
        <details className="mt-2 text-sm text-muted">
          <summary className="cursor-pointer">Джерело запису</summary>
          <div className="mt-2 space-y-2">
            {session.source_url && (
              <a href={session.source_url} target="_blank" rel="noreferrer" className="block break-all text-accent">
                {session.source_url}
              </a>
            )}
            {session.source_text && <Prose>{session.source_text}</Prose>}
          </div>
        </details>
      )}
    </article>
  );
}
