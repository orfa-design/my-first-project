import Link from "next/link";
import { formatDate, todayKyiv } from "@/lib/dates";
import { CLASS_KIND_LABELS, STATUS_LABELS, STATUS_STYLES } from "@/lib/labels";
import { CONTROL_KINDS, type ClassKind, type TaskStatus } from "@/lib/schemas";
import type { ClassSessionWithSubject } from "@/lib/types";

export const isControlKind = (kind: ClassKind) => (CONTROL_KINDS as readonly string[]).includes(kind);

export function KindBadge({ kind }: { kind: ClassKind }) {
  const style = isControlKind(kind) ? "bg-warn-soft text-warn" : "bg-surface-muted text-muted";
  return (
    <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${style}`}>
      {CLASS_KIND_LABELS[kind]}
    </span>
  );
}

const badge = "ml-2 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium";

/** Завдання предмета за статусами — у тих самих кольорах, що й статус у списку завдань. */
function TaskBadges({ c }: { c: ClassSessionWithSubject }) {
  const notStarted = c.subject_open_tasks - c.subject_in_progress_tasks - c.subject_revision_tasks;
  const items: [TaskStatus, number, string][] = [
    ["not_started", notStarted, `${notStarted} не розпочато`],
    ["in_progress", c.subject_in_progress_tasks, `${c.subject_in_progress_tasks} у процесі`],
    ["needs_revision", c.subject_revision_tasks, `${c.subject_revision_tasks} на доопрацюванні`],
    ["submitted", c.subject_submitted_tasks, `${c.subject_submitted_tasks} здано`],
    ["completed", c.subject_completed_tasks, `✓ ${c.subject_completed_tasks} зараховано`],
  ];
  return (
    <>
      {items
        .filter(([, n]) => n > 0)
        .map(([status, , label]) => (
          <span key={status} className={`${badge} ${STATUS_STYLES[status]}`} title={STATUS_LABELS[status]}>
            {label}
          </span>
        ))}
    </>
  );
}

/** Для публічного розкладу: скільки всього завдань у предмета — без розбивки за особистим статусом. */
function TaskCount({ c }: { c: ClassSessionWithSubject }) {
  const total = c.subject_open_tasks + c.subject_submitted_tasks + c.subject_completed_tasks;
  if (!total) return null;
  // 1, 2–4 (крім 11–14) — «завдання», решта — «завдань».
  const few = total % 10 >= 1 && total % 10 <= 4 && !(total % 100 >= 11 && total % 100 <= 14);
  const label = few ? "завдання" : "завдань";
  return <span className={`${badge} bg-surface-muted text-muted`}>📝 {total} {label}</span>;
}

/** «12:30–13:50», «12:30» або порожньо. */
export function timeRange(c: Pick<ClassSessionWithSubject, "starts_at" | "ends_at">): string {
  if (!c.starts_at) return "";
  return c.ends_at ? `${c.starts_at.slice(0, 5)}–${c.ends_at.slice(0, 5)}` : c.starts_at.slice(0, 5);
}

/** Заняття, згруповані за днями. */
/** Куди веде заняття і чи це публічний перегляд (без оцінок і нотаток). */
export type ClassView = { hrefFor?: (id: string) => string; publicView?: boolean };

const defaultHref = (id: string) => `/study/schedule/${id}`;

export function ClassDays({
  classes,
  showSubject = true,
  currentId,
  view,
}: {
  classes: ClassSessionWithSubject[];
  showSubject?: boolean;
  /** Заняття, яке зараз відкрите, — підсвічується. */
  currentId?: string;
  view?: ClassView;
}) {
  const days = new Map<string, ClassSessionWithSubject[]>();
  for (const c of classes) days.set(c.date, [...(days.get(c.date) ?? []), c]);
  return (
    <div className="space-y-4">
      {[...days].map(([date, items]) => (
        <ClassDay key={date} date={date} classes={items} showSubject={showSubject} currentId={currentId} view={view} />
      ))}
    </div>
  );
}

export function ClassDay({
  date,
  classes,
  showSubject = true,
  currentId,
  view,
}: {
  date: string;
  classes: ClassSessionWithSubject[];
  showSubject?: boolean;
  currentId?: string;
  view?: ClassView;
}) {
  const isToday = date === todayKyiv();
  return (
    <div className={`card ${isToday ? "border-accent" : ""}`}>
      <h3 className="border-b border-border px-4 py-2 text-sm font-semibold">
        {formatDate(date)}
        {isToday && <span className="ml-2 font-normal text-accent">сьогодні</span>}
      </h3>
      {classes.length ? (
        <ul className="divide-y divide-border">
          {classes.map((c) => (
            <ClassRow key={c.id} c={c} showSubject={showSubject} current={c.id === currentId} view={view} />
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-muted">Занять немає.</p>
      )}
    </div>
  );
}

/**
 * Одна пара — один рядок на широкому екрані: час | предмет | вид і викладач.
 * На смартфоні вид і викладач переходять під назву предмета.
 */
function ClassRow({
  c,
  showSubject,
  current,
  view,
}: {
  c: ClassSessionWithSubject;
  showSubject: boolean;
  current: boolean;
  view?: ClassView;
}) {
  const pub = view?.publicView ?? false;
  const cancelled = c.status === "cancelled";
  const struck = cancelled ? "text-muted line-through" : "";
  return (
    <li>
      <Link
        href={(view?.hrefFor ?? defaultHref)(c.id)}
        aria-current={current ? "page" : undefined}
        title={c.subject_closed && !pub ? "Предмет закрито — не потребує уваги" : undefined}
        className={`${current ? "bg-accent-soft" : "hover:bg-surface-muted"} ${c.subject_closed && !pub ? "opacity-45" : ""} grid grid-cols-[5.75rem_1fr] items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm md:grid-cols-[6.5rem_1fr_auto] md:gap-x-4`}
      >
        <span className={`tabular-nums ${struck}`}>{timeRange(c) || <span className="text-muted">час ?</span>}</span>
        <span className={`font-medium ${struck}`}>
          {showSubject ? (c.subject_name ?? "Без предмета") : isControlKind(c.kind) ? <KindBadge kind={c.kind} /> : CLASS_KIND_LABELS[c.kind]}
          {showSubject && (pub ? <TaskCount c={c} /> : <TaskBadges c={c} />)}
        </span>
        <span className="col-start-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted md:col-start-3 md:flex-nowrap md:justify-end md:whitespace-nowrap">
          {showSubject && <KindBadge kind={c.kind} />}
          {c.grade_text && !pub && (
            <span className="rounded bg-ok-soft px-1.5 py-0.5 text-xs font-medium text-ok" title="Оцінка в журналі">
              ✓ {c.grade_text}
            </span>
          )}
          {cancelled && <span className="text-danger">скасовано</span>}
          {c.teacher_name && <span>{c.teacher_name}</span>}
          {c.location && <span>· {c.location}</span>}
          {c.needs_review && !pub && <span className="text-warn">перевірити</span>}
        </span>
        {c.notes && !pub && (
          <span className="col-start-2 line-clamp-2 whitespace-pre-line text-xs text-muted md:col-end-4" title={c.notes}>
            📝 {c.notes}
          </span>
        )}
      </Link>
    </li>
  );
}
