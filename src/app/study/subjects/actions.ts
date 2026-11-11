"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createSubject, deleteSubject, updateSubject } from "@/lib/data/subjects";
import { pickFields, type FormState } from "@/lib/form";
import { firstIssue, subjectInput, subjectPatch } from "@/lib/schemas";

const FIELDS = [
  "name", "code", "semester_id", "teacher_name", "teacher_contacts", "control_form",
  "grading_rules", "admission_requirements", "notes",
] as const;

export async function createSubjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = subjectInput.safeParse(pickFields(formData, FIELDS));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const subject = await createSubject(parsed.data);
  redirect(`/study/subjects/${subject.id}`);
}

export async function updateSubjectAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = subjectPatch.safeParse(pickFields(formData, FIELDS));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await updateSubject(id, parsed.data);
  redirect(`/study/subjects/${id}`);
}

export async function deleteSubjectAction(id: string): Promise<void> {
  await requireSession();
  await deleteSubject(id);
  redirect("/study/subjects");
}

/** Позначити предмет закритим (не потребує уваги) або повернути в роботу. */
export async function setSubjectClosedAction(id: string, closed: boolean): Promise<void> {
  await requireSession();
  await updateSubject(id, { is_closed: closed });
  refresh();
}
