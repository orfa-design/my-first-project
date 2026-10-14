import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { DueLabel, Loading, Prose, Section, StatusBadge } from "@/components/ui";
import { getTask } from "@/lib/data/tasks";
import { isUuid } from "@/lib/ids";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { TASK_STATUSES } from "@/lib/schemas";
import {
  deleteTaskAction,
  markReviewedAction,
  setTaskStatusAction,
  toggleChecklistItemAction,
} from "../actions";

export default function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <TaskDetails params={params} />
    </Suspense>
  );
}

async function TaskDetails({ params }: { params: PageProps<"/tasks/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const task = await getTask(id);
  if (!task) notFound();

  const done = task.checklist.filter((i) => i.done).length;

  return (
    <article>
      <div className="mb-1 text-sm">
        {task.subject_id ? (
          <Link href={`/subjects/${task.subject_id}`} className="text-accent">{task.subject_name}</Link>
        ) : (
          <span className="text-muted">Без предмета</span>
        )}
      </div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <StatusBadge status={task.status} />
            <DueLabel task={task} />
            {task.priority && task.priority !== "normal" && (
              <span className="text-muted">Пріоритет: {PRIORITY_LABELS[task.priority].toLowerCase()}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/tasks/${task.id}/edit`} className="btn-secondary">Редагувати</Link>
          <form action={deleteTaskAction.bind(null, task.id)}>
            <ConfirmButton message="Видалити це завдання?" className="btn-danger">Видалити</ConfirmButton>
          </form>
        </div>
      </header>

      {task.needs_review && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          <span>AI позначив, що частина даних може бути неточною. Перевірте з джерелом нижче.</span>
          <form action={markReviewedAction.bind(null, task.id)}>
            <button className="btn-secondary">Усе правильно</button>
          </form>
        </div>
      )}

      <form action={setTaskStatusAction.bind(null, task.id)} className="card mb-6 flex flex-wrap items-center gap-2 p-3">
        <span className="text-sm text-muted">Змінити статус:</span>
        {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
          <button key={s} name="status" value={s} className="btn-secondary px-2.5 py-1 text-xs">
            {STATUS_LABELS[s]}
          </button>
        ))}
      </form>

      {task.result && (
        <Section title="Результат">
          <p className="font-medium">{task.result}</p>
        </Section>
      )}

      {task.description && (
        <Section title="Опис та інструкції">
          <Prose>{task.description}</Prose>
        </Section>
      )}

      {task.checklist.length > 0 && (
        <Section title={`Підзавдання · ${done}/${task.checklist.length}`}>
          <ul className="card divide-y divide-border">
            {task.checklist.map((item, i) => (
              <li key={i}>
                <form action={toggleChecklistItemAction.bind(null, task.id, i)}>
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-muted">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${item.done ? "border-ok bg-ok text-white" : "border-border"}`}>
                      {item.done && "✓"}
                    </span>
                    <span className={item.done ? "text-muted line-through" : ""}>{item.text}</span>
                  </button>
                </form>
              </li>
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

      <p className="text-xs text-muted">
        Створено {task.created_at.toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })} · оновлено{" "}
        {task.updated_at.toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}
      </p>
    </article>
  );
}
