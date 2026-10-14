"use client";

import type { FormState } from "@/lib/form";
import type { Semester } from "@/lib/types";
import { Field, FormShell } from "./form-shell";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  semester?: Semester;
};

export function SemesterForm({ action, semester }: Props) {
  return (
    <FormShell action={action} submitLabel={semester ? "Зберегти" : "Додати семестр"}>
      <Field label="Назва" hint="Наприклад: «3 курс, осінній семестр 2026»">
        <input name="name" required defaultValue={semester?.name} className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Початок семестру">
          <input type="date" name="starts_on" defaultValue={semester?.starts_on ?? ""} className="input" />
        </Field>
        <Field label="Кінець семестру">
          <input type="date" name="ends_on" defaultValue={semester?.ends_on ?? ""} className="input" />
        </Field>
        <Field label="Початок сесії">
          <input type="date" name="session_starts_on" defaultValue={semester?.session_starts_on ?? ""} className="input" />
        </Field>
        <Field label="Кінець сесії">
          <input type="date" name="session_ends_on" defaultValue={semester?.session_ends_on ?? ""} className="input" />
        </Field>
      </div>
      <Field label="Нотатки">
        <textarea name="notes" rows={2} defaultValue={semester?.notes ?? ""} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_current" defaultChecked={semester ? semester.is_current : true} />
        Поточний семестр
      </label>
    </FormShell>
  );
}
