"use server";

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
  redirect(`/subjects/${subject.id}`);
}

export async function updateSubjectAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = subjectPatch.safeParse(pickFields(formData, FIELDS));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await updateSubject(id, parsed.data);
  redirect(`/subjects/${id}`);
}

export async function deleteSubjectAction(id: string): Promise<void> {
  await requireSession();
  await deleteSubject(id);
  redirect("/subjects");
}
