import Link from "next/link";
import type { ReactNode } from "react";
import { daysBetween, formatDate, relativeDue, todayKyiv } from "@/lib/dates";
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

type DueTask = Pick<TaskWithSubject, "due_date" | "due_time" | "status">;

/** Наскільки терміновий дедлайн: прострочено — червоний, до 3 днів — жовтий; здане — приглушене. */
function dueTone(task: DueTask, today: string): string {
  if (!task.due_date || !(OPEN_TASK_STATUSES as readonly string[]).includes(task.status)) return "text-muted";
  const days = daysBetween(today, task.due_date);
  if (days < 0) return "text-danger";
  if (days <= 3) return "text-warn";
  return "text-text";
}

export function DueLabel({ task }: { task: DueTask }) {
  if (!task.due_date) return <span className="text-muted">без дедлайну</span>;
  const today = todayKyiv();
  return (
    <span className={`font-medium ${dueTone(task, today)}`}>
      {formatDate(task.due_date)}
      {task.due_time && `, ${task.due_time.slice(0, 5)}`} · {relativeDue(task.due_date, today)}
    </span>
  );
}

/** Дедлайн у списку — окремим помітним блоком: дата, під нею «через N дн.». */
function DueBlock({ task }: { task: DueTask }) {
  if (!task.due_date) return <span className="text-sm text-muted">без дедлайну</span>;
  const today = todayKyiv();
  const tone = dueTone(task, today);
  return (
    <span className={`flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0 ${tone}`}>
      <span className="font-semibold">
        {formatDate(task.due_date)}
        {task.due_time && `, ${task.due_time.slice(0, 5)}`}
      </span>
      <span className="text-sm">{relativeDue(task.due_date, today)}</span>
    </span>
  );
}

export function TaskList({ tasks, showSubject = true }: { tasks: TaskWithSubject[]; showSubject?: boolean }) {
  return (
    <ul className="card divide-y divide-border">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link href={`/tasks/${task.id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-6">
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {task.title}
                {task.needs_review && (
                  <span className="ml-2 text-xs font-normal text-warn" title="AI не впевнений у частині даних">
                    перевірити
                  </span>
                )}
              </div>
              {showSubject && <div className="truncate text-sm text-muted">{task.subject_name ?? "Без предмета"}</div>}
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <DueBlock task={task} />
              <div className="flex items-center gap-2 sm:w-44 sm:justify-end">
                {task.result && <span className="text-sm text-muted">{task.result}</span>}
                <StatusBadge status={task.status} />
              </div>
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

const URL_PATTERN = /(https?:\/\/[^\s<>«»"]+[^\s<>«»".,;:!?)\]])/g;

/** Коротка назва посилання замість довгої адреси: «drive.google.com ↗». */
function linkLabel(url: string): string {
  try {
    return `${new URL(url).hostname.replace(/^www\./, "")} ↗`;
  } catch {
    return url;
  }
}

/** Текст із збереженими переносами рядків; адреси в ньому стають клікабельними посиланнями. */
export function Prose({ children }: { children: string }) {
  const parts = children.split(URL_PATTERN);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noreferrer" title={part} className="text-accent underline-offset-2 hover:underline">
            {linkLabel(part)}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}
