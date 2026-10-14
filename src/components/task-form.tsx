"use client";

import { checklistToText, type FormState } from "@/lib/form";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { PRIORITIES, TASK_STATUSES } from "@/lib/schemas";
import type { Task } from "@/lib/types";
import { Field, FormShell } from "./form-shell";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  subjects: { id: string; name: string }[];
  task?: Task;
  defaultSubjectId?: string;
};

export function TaskForm({ action, subjects, task, defaultSubjectId }: Props) {
  return (
    <FormShell action={action} submitLabel={task ? "Зберегти" : "Створити завдання"}>
      <Field label="Назва">
        <input name="title" required defaultValue={task?.title} className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Предмет">
          <select name="subject_id" defaultValue={task?.subject_id ?? defaultSubjectId ?? ""} className="input">
            <option value="">— без предмета —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Статус">
          <select name="status" defaultValue={task?.status ?? "not_started"} className="input">
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Дедлайн">
          <input type="date" name="due_date" defaultValue={task?.due_date ?? ""} className="input" />
        </Field>
        <Field label="Час" hint="Необов'язково">
          <input type="time" name="due_time" defaultValue={task?.due_time?.slice(0, 5) ?? ""} className="input" />
        </Field>
        <Field label="Пріоритет">
          <select name="priority" defaultValue={task?.priority ?? ""} className="input">
            <option value="">—</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </Field>
        <Field label="Результат" hint="Як повідомив викладач: «18/20», «зараховано»">
          <input name="result" defaultValue={task?.result ?? ""} className="input" />
        </Field>
      </div>
      <Field label="Опис та інструкції">
        <textarea name="description" rows={5} defaultValue={task?.description ?? ""} className="input" />
      </Field>
      <Field label="Підзавдання" hint="Один пункт на рядок. «[x] » на початку — виконано.">
        <textarea name="checklist" rows={3} defaultValue={task ? checklistToText(task.checklist) : ""} className="input font-mono" />
      </Field>
      <Field label="Як і куди здавати">
        <textarea name="submission_info" rows={2} defaultValue={task?.submission_info ?? ""} className="input" />
      </Field>
      <details className="rounded-md border border-border px-3 py-2" open={Boolean(task?.source_text || task?.source_url)}>
        <summary className="cursor-pointer text-sm font-medium">Джерело</summary>
        <div className="mt-3 space-y-4">
          <Field label="Посилання">
            <input name="source_url" type="url" defaultValue={task?.source_url ?? ""} className="input" />
          </Field>
          <Field label="Оригінальний текст" hint="Повідомлення або оголошення, з якого створено завдання">
            <textarea name="source_text" rows={4} defaultValue={task?.source_text ?? ""} className="input" />
          </Field>
        </div>
      </details>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="needs_review" defaultChecked={task?.needs_review} />
        Потребує перевірки (дані можуть бути неточними)
      </label>
    </FormShell>
  );
}
