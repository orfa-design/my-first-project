import type { TaskStatus } from "./schemas";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Не розпочато",
  in_progress: "У процесі",
  submitted: "Здано, чекає оцінки",
  completed: "Зараховано",
  needs_revision: "Потребує доопрацювання",
};

export const PRIORITY_LABELS = { low: "Низький", normal: "Звичайний", high: "Високий" } as const;

export const CONTROL_FORM_LABELS = {
  exam: "Екзамен",
  credit: "Залік",
  diff_credit: "Диференційований залік",
  other: "Інше",
} as const;
