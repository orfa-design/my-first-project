import type { ClassKind, TaskStatus } from "./schemas";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Не розпочато",
  in_progress: "У процесі",
  submitted: "Здано, чекає оцінки",
  completed: "Зараховано",
  needs_revision: "Потребує доопрацювання",
};

/** Приглушені кольори статусів — для мітки й меню статусу. */
export const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "bg-surface-muted text-muted",
  in_progress: "bg-accent-soft text-accent",
  submitted: "bg-warn-soft text-warn",
  completed: "bg-ok-soft text-ok",
  needs_revision: "bg-danger-soft text-danger",
};

export const PRIORITY_LABELS = { low: "Низький", normal: "Звичайний", high: "Високий" } as const;

export const CONTROL_FORM_LABELS = {
  exam: "Екзамен",
  credit: "Залік",
  diff_credit: "Диференційований залік",
  other: "Інше",
} as const;

export const CLASS_KIND_LABELS: Record<ClassKind, string> = {
  lecture: "Лекція",
  practice: "Практичне",
  lab: "Лабораторна",
  consultation: "Консультація",
  exam: "Екзамен",
  credit: "Залік",
  diff_credit: "Диф. залік",
  other: "Інше",
};
