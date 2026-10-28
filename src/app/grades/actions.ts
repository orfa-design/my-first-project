"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createAssessment, deleteAssessment, updateAssessment } from "@/lib/data/assessments";
import { pickFields, type FormState } from "@/lib/form";
import { assessmentInput, assessmentPatch, firstIssue } from "@/lib/schemas";

const FIELDS = ["title", "subject_id", "score", "max_score", "result_text", "assessed_on", "teacher_comment"] as const;

function fromForm(formData: FormData) {
  return { ...pickFields(formData, FIELDS), needs_review: formData.get("needs_review") === "on" };
}

export async function createGradeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = assessmentInput.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await createAssessment(parsed.data);
  redirect("/grades");
}

export async function updateGradeAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = assessmentPatch.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await updateAssessment(id, parsed.data);
  redirect("/grades");
}

export async function deleteGradeAction(id: string): Promise<void> {
  await requireSession();
  await deleteAssessment(id);
  redirect("/grades");
}
