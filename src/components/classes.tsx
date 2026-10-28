import Link from "next/link";
import { formatDate, todayKyiv } from "@/lib/dates";
import { CLASS_KIND_LABELS } from "@/lib/labels";
import { CONTROL_KINDS, type ClassKind } from "@/lib/schemas";
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

/** «12:30–13:50», «12:30» або порожньо. */
export function timeRange(c: Pick<ClassSessionWithSubject, "starts_at" | "ends_at">): string {
  if (!c.starts_at) return "";
  return c.ends_at ? `${c.starts_at.slice(0, 5)}–${c.ends_at.slice(0, 5)}` : c.starts_at.slice(0, 5);
}

/** Заняття, згруповані за днями. */
export function ClassDays({ classes, showSubject = true }: { classes: ClassSessionWithSubject[]; showSubject?: boolean }) {
  const days = new Map<string, ClassSessionWithSubject[]>();
  for (const c of classes) days.set(c.date, [...(days.get(c.date) ?? []), c]);
  return (
    <div className="space-y-4">
      {[...days].map(([date, items]) => (
        <ClassDay key={date} date={date} classes={items} showSubject={showSubject} />
      ))}
    </div>
  );
}

export function ClassDay({
  date,
  classes,
  showSubject = true,
}: {
  date: string;
  classes: ClassSessionWithSubject[];
  showSubject?: boolean;
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
            <ClassRow key={c.id} c={c} showSubject={showSubject} />
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-muted">Занять немає.</p>
      )}
    </div>
  );
}

function ClassRow({ c, showSubject }: { c: ClassSessionWithSubject; showSubject: boolean }) {
  const cancelled = c.status === "cancelled";
  return (
    <li>
      <Link href={`/schedule/${c.id}`} className="flex gap-3 px-4 py-2.5 text-sm hover:bg-surface-muted">
        <span className={`w-24 shrink-0 tabular-nums ${cancelled ? "text-muted line-through" : ""}`}>
          {timeRange(c) || <span className="text-muted">час ?</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`font-medium ${cancelled ? "text-muted line-through" : ""}`}>
            {showSubject ? (c.subject_name ?? "Без предмета") : isControlKind(c.kind) ? <KindBadge kind={c.kind} /> : CLASS_KIND_LABELS[c.kind]}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
            {showSubject && <KindBadge kind={c.kind} />}
            {cancelled && <span className="text-danger">скасовано</span>}
            {c.teacher_name && <span>{c.teacher_name}</span>}
            {c.location && <span>· {c.location}</span>}
            {c.needs_review && <span className="text-warn">перевірити</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}
