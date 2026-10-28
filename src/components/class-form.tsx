"use client";

import type { FormState } from "@/lib/form";
import { CLASS_KIND_LABELS } from "@/lib/labels";
import { CLASS_KINDS } from "@/lib/schemas";
import type { ClassSession } from "@/lib/types";
import { Field, FormShell } from "./form-shell";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  subjects: { id: string; name: string }[];
  session?: ClassSession;
  defaults?: { subject_id?: string; date?: string };
};

export function ClassForm({ action, subjects, session, defaults }: Props) {
  return (
    <FormShell action={action} submitLabel={session ? "Зберегти" : "Додати заняття"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Предмет">
          <select name="subject_id" defaultValue={session?.subject_id ?? defaults?.subject_id ?? ""} className="input">
            <option value="">— без предмета —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Вид">
          <select name="kind" defaultValue={session?.kind ?? "lecture"} className="input">
            {CLASS_KINDS.map((k) => (
              <option key={k} value={k}>{CLASS_KIND_LABELS[k]}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Дата">
          <input type="date" name="date" required defaultValue={session?.date ?? defaults?.date ?? ""} className="input" />
        </Field>
        <Field label="Початок">
          <input type="time" name="starts_at" defaultValue={session?.starts_at?.slice(0, 5) ?? ""} className="input" />
        </Field>
        <Field label="Кінець">
          <input type="time" name="ends_at" defaultValue={session?.ends_at?.slice(0, 5) ?? ""} className="input" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Викладач">
          <input name="teacher_name" defaultValue={session?.teacher_name ?? ""} className="input" />
        </Field>
        <Field label="Аудиторія або посилання">
          <input name="location" defaultValue={session?.location ?? ""} className="input" />
        </Field>
      </div>
      <Field label="Нотатки">
        <textarea name="notes" rows={3} defaultValue={session?.notes ?? ""} className="input" />
      </Field>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="cancelled" defaultChecked={session?.status === "cancelled"} />
          Заняття скасовано
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="needs_review" defaultChecked={session?.needs_review ?? false} />
          Дані треба перевірити
        </label>
      </div>
    </FormShell>
  );
}
