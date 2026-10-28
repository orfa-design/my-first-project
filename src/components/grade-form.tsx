"use client";

import type { FormState } from "@/lib/form";
import type { Assessment } from "@/lib/types";
import { Field, FormShell } from "./form-shell";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  subjects: { id: string; name: string }[];
  grade?: Assessment;
  defaultSubjectId?: string;
};

export function GradeForm({ action, subjects, grade, defaultSubjectId }: Props) {
  return (
    <FormShell action={action} submitLabel={grade ? "Зберегти" : "Додати оцінку"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Що оцінювали">
          <input name="title" required defaultValue={grade?.title} placeholder="Модульна контрольна, екзамен…" className="input" />
        </Field>
        <Field label="Предмет">
          <select name="subject_id" defaultValue={grade?.subject_id ?? defaultSubjectId ?? ""} className="input">
            <option value="">— без предмета —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Бал">
          <input name="score" inputMode="decimal" defaultValue={grade?.score ?? ""} className="input" />
        </Field>
        <Field label="З максимуму">
          <input name="max_score" inputMode="decimal" defaultValue={grade?.max_score ?? ""} className="input" />
        </Field>
        <Field label="Результат текстом">
          <input name="result_text" defaultValue={grade?.result_text ?? ""} placeholder="зараховано" className="input" />
        </Field>
        <Field label="Дата">
          <input type="date" name="assessed_on" defaultValue={grade?.assessed_on ?? ""} className="input" />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">Невідомий бал залиште порожнім — це не нуль.</p>
      <Field label="Коментар викладача">
        <textarea name="teacher_comment" rows={3} defaultValue={grade?.teacher_comment ?? ""} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="needs_review" defaultChecked={grade?.needs_review ?? false} />
        Дані треба перевірити
      </label>
    </FormShell>
  );
}
