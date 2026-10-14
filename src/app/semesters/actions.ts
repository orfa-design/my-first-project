"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createSemester, deleteSemester, updateSemester } from "@/lib/data/semesters";
import { pickFields, type FormState } from "@/lib/form";
import { firstIssue, semesterInput, semesterPatch } from "@/lib/schemas";

const FIELDS = ["name", "starts_on", "ends_on", "session_starts_on", "session_ends_on", "notes"] as const;

function fromForm(formData: FormData) {
  return { ...pickFields(formData, FIELDS), is_current: formData.get("is_current") === "on" };
}

export async function createSemesterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = semesterInput.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await createSemester(parsed.data);
  redirect("/semesters");
}

export async function updateSemesterAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = semesterPatch.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await updateSemester(id, parsed.data);
  redirect("/semesters");
}

export async function deleteSemesterAction(id: string): Promise<void> {
  await requireSession();
  await deleteSemester(id);
  redirect("/semesters");
}
