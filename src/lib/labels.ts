import type { ClassKind, TaskStatus } from "./schemas";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Не розпочато",
  in_progress: "У процесі",
  submitted: "Здано, чекає оцінки",
  completed: "Зараховано",
  needs_revision: "Потребує доопрацювання",
};

/**
 * Кольори статусів — у кожного свій і не збігається з мітками виду пари
 * (сіра заливка — вид пари, жовтий — екзамен / залік).
 */
export const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "bg-transparent text-muted ring-1 ring-inset ring-border",
  in_progress: "bg-accent-soft text-accent",
  submitted: "bg-violet-soft text-violet",
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
