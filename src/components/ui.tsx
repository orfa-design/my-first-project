import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate, relativeDue, todayKyiv } from "@/lib/dates";
import { STATUS_LABELS } from "@/lib/labels";
import { OPEN_TASK_STATUSES, type TaskStatus } from "@/lib/schemas";
import type { TaskWithSubject } from "@/lib/types";

export function PageHeader({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}

export function Section({ title, count, children, action }: { title: string; count?: number; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {title}
          {count !== undefined && count > 0 && <span className="ml-1.5 font-normal">· {count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Порожній стан із підказкою, що зробити далі. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted">{children}</p>;
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "bg-surface-muted text-muted",
  in_progress: "bg-accent-soft text-accent",
  submitted: "bg-warn-soft text-warn",
  completed: "bg-ok-soft text-ok",
  needs_revision: "bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function DueLabel({ task }: { task: Pick<TaskWithSubject, "due_date" | "due_time" | "status"> }) {
  if (!task.due_date) return <span className="text-muted">без дедлайну</span>;
  const today = todayKyiv();
  const overdue = task.due_date < today && (OPEN_TASK_STATUSES as readonly string[]).includes(task.status);
  return (
    <span className={overdue ? "font-medium text-danger" : "text-muted"}>
      {formatDate(task.due_date)}
      {task.due_time && `, ${task.due_time.slice(0, 5)}`} · {relativeDue(task.due_date, today)}
    </span>
  );
}

export function TaskList({ tasks, showSubject = true }: { tasks: TaskWithSubject[]; showSubject?: boolean }) {
  return (
    <ul className="card divide-y divide-border">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link href={`/tasks/${task.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                {task.title}
                {task.needs_review && (
                  <span className="ml-2 text-xs font-normal text-warn" title="AI не впевнений у частині даних">
                    перевірити
                  </span>
                )}
              </div>
              <div className="text-sm">
                {showSubject && <span className="text-muted">{task.subject_name ?? "Без предмета"} · </span>}
                <DueLabel task={task} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task.result && <span className="text-sm text-muted">{task.result}</span>}
              <StatusBadge status={task.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Loading() {
  return <div className="animate-pulse space-y-3"><div className="h-20 rounded-lg bg-surface-muted" /><div className="h-20 rounded-lg bg-surface-muted" /></div>;
}

/** Текст із збереженими переносами рядків. */
export function Prose({ children }: { children: string }) {
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{children}</p>;
}
