"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClass, deleteClass, updateClass } from "@/lib/data/classes";
import { pickFields, type FormState } from "@/lib/form";
import { classSessionInput, classSessionPatch, firstIssue } from "@/lib/schemas";

const FIELDS = ["subject_id", "date", "starts_at", "ends_at", "kind", "teacher_name", "location", "notes"] as const;

function fromForm(formData: FormData) {
  return {
    ...pickFields(formData, FIELDS),
    status: formData.get("cancelled") === "on" ? "cancelled" : "scheduled",
    needs_review: formData.get("needs_review") === "on",
  };
}

export async function createClassAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = classSessionInput.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const session = await createClass(parsed.data);
  redirect(`/schedule?week=${session.date}`);
}

export async function updateClassAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = classSessionPatch.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const session = await updateClass(id, parsed.data);
  redirect(session ? `/schedule?week=${session.date}` : "/schedule");
}

export async function deleteClassAction(id: string, date: string): Promise<void> {
  await requireSession();
  await deleteClass(id);
  redirect(`/schedule?week=${date}`);
}
