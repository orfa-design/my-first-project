import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DueLabel, Loading, Prose, Section } from "@/components/ui";
import { getTask } from "@/lib/data/tasks";
import { isUuid } from "@/lib/ids";
import { PublicBadge, publicHref, requireScheduleToken } from "../../shared";

export default function PublicTaskPage({ params }: PageProps<"/s/[token]/task/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <TaskDetails params={params} />
    </Suspense>
  );
}

/** Завдання для публічного перегляду: усе про саме завдання (опис, підзавдання, як здати, джерело) —
 * без особистого: статусу, результату (оцінки), пріоритету й галочок «виконано» в підзавданнях. */
async function TaskDetails({ params }: { params: PageProps<"/s/[token]/task/[id]">["params"] }) {
  await connection();
  const { token, id } = await params;
  await requireScheduleToken(token);
  if (!isUuid(id)) notFound();
  const task = await getTask(id);
  if (!task) notFound();
  const href = publicHref(token);

  return (
    <article>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        {task.subject_id ? (
          <Link href={href.subject(task.subject_id)} className="text-accent">← {task.subject_name}</Link>
        ) : (
          <Link href={href.schedule()} className="text-accent">← Розклад</Link>
        )}
        <PublicBadge />
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <DueLabel task={task} neutral />
        </div>
      </header>
      {task.description && (
        <Section title="Опис та інструкції">
          <Prose>{task.description}</Prose>
        </Section>
      )}
      {task.checklist.length > 0 && (
        <Section title="Що входить у завдання">
          <ul className="card list-disc space-y-1.5 py-3 pl-9 pr-4 text-sm">
            {task.checklist.map((item, i) => (
              <li key={i}>{item.text}</li>
            ))}
          </ul>
        </Section>
      )}
      {task.submission_info && (
        <Section title="Як і куди здавати">
          <Prose>{task.submission_info}</Prose>
        </Section>
      )}
      {(task.source_text || task.source_url) && (
        <Section title="Джерело">
          <div className="card space-y-2 p-4">
            {task.source_url && (
              <a href={task.source_url} target="_blank" rel="noreferrer" className="block break-all text-sm text-accent">
                {task.source_url}
              </a>
            )}
            {task.source_text && <Prose>{task.source_text}</Prose>}
          </div>
        </Section>
      )}
      {!task.description && !task.submission_info && !task.checklist.length && !task.source_text && !task.source_url && (
        <p className="text-sm text-muted">Деталей до цього завдання поки немає.</p>
      )}
    </article>
  );
}
