"use client";

import { useTransition } from "react";
import { setTaskStatusAction } from "@/app/study/tasks/actions";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/labels";
import { TASK_STATUSES, type TaskStatus } from "@/lib/schemas";

/** Статус завдання, який можна змінити прямо в списку: вибір одразу зберігається. */
export function StatusSelect({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="Статус завдання"
      value={status}
      disabled={pending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("status", e.target.value);
        startTransition(() => setTaskStatusAction(taskId, formData));
      }}
      className={`relative z-10 cursor-pointer rounded border-0 px-1.5 py-0.5 text-xs font-medium outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60 ${STATUS_STYLES[status]}`}
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
