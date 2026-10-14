"use client";

import type { FormState } from "@/lib/form";
import { CONTROL_FORM_LABELS } from "@/lib/labels";
import { CONTROL_FORMS } from "@/lib/schemas";
import type { Subject } from "@/lib/types";
import { Field, FormShell } from "./form-shell";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  semesters: { id: string; name: string; is_current: boolean }[];
  subject?: Subject;
};

export function SubjectForm({ action, semesters, subject }: Props) {
  const current = semesters.find((s) => s.is_current)?.id;
  return (
    <FormShell action={action} submitLabel={subject ? "Зберегти" : "Створити предмет"}>
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Назва">
          <input name="name" required defaultValue={subject?.name} className="input" />
        </Field>
        <Field label="Код">
          <input name="code" defaultValue={subject?.code ?? ""} className="input" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Семестр">
          <select name="semester_id" defaultValue={subject ? (subject.semester_id ?? "") : (current ?? "")} className="input">
            <option value="">—</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Форма контролю">
          <select name="control_form" defaultValue={subject?.control_form ?? ""} className="input">
            <option value="">— невідомо —</option>
            {CONTROL_FORMS.map((f) => (
              <option key={f} value={f}>{CONTROL_FORM_LABELS[f]}</option>
            ))}
          </select>
        </Field>
        <Field label="Викладач">
          <input name="teacher_name" defaultValue={subject?.teacher_name ?? ""} className="input" />
        </Field>
        <Field label="Контакти викладача">
          <input name="teacher_contacts" defaultValue={subject?.teacher_contacts ?? ""} className="input" />
        </Field>
      </div>
      <Field label="Допуск до сесії" hint="Що потрібно здати, щоб допустили до заліку чи екзамену">
        <textarea name="admission_requirements" rows={3} defaultValue={subject?.admission_requirements ?? ""} className="input" />
      </Field>
      <Field label="Вимоги до оцінювання" hint="Як нараховуються бали — так, як це пояснив викладач">
        <textarea name="grading_rules" rows={3} defaultValue={subject?.grading_rules ?? ""} className="input" />
      </Field>
      <Field label="Нотатки">
        <textarea name="notes" rows={3} defaultValue={subject?.notes ?? ""} className="input" />
      </Field>
    </FormShell>
  );
}
