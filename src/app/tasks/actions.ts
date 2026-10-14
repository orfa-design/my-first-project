"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createTask, deleteTask, getTask, updateTask } from "@/lib/data/tasks";
import { parseChecklist, pickFields, type FormState } from "@/lib/form";
import { firstIssue, TASK_STATUSES, taskInput, taskPatch, type TaskStatus } from "@/lib/schemas";

const TEXT_FIELDS = [
  "title", "subject_id", "description", "due_date", "due_time", "status", "priority",
  "submission_info", "result", "source_text", "source_url",
] as const;

function fromForm(formData: FormData) {
  return {
    ...pickFields(formData, TEXT_FIELDS),
    checklist: parseChecklist(String(formData.get("checklist") ?? "")),
    needs_review: formData.get("needs_review") === "on",
  };
}

export async function createTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = taskInput.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const task = await createTask(parsed.data);
  redirect(`/tasks/${task.id}`);
}

export async function updateTaskAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const parsed = taskPatch.safeParse(fromForm(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await updateTask(id, parsed.data);
  redirect(`/tasks/${id}`);
}

export async function setTaskStatusAction(id: string, formData: FormData): Promise<void> {
  await requireSession();
  const status = formData.get("status") as TaskStatus;
  if (!TASK_STATUSES.includes(status)) return;
  await updateTask(id, { status });
  refresh();
}

export async function toggleChecklistItemAction(id: string, index: number): Promise<void> {
  await requireSession();
  const task = await getTask(id);
  if (!task || !task.checklist[index]) return;
  const checklist = task.checklist.map((item, i) => (i === index ? { ...item, done: !item.done } : item));
  await updateTask(id, { checklist });
  refresh();
}

export async function markReviewedAction(id: string): Promise<void> {
  await requireSession();
  await updateTask(id, { needs_review: false });
  refresh();
}

export async function deleteTaskAction(id: string): Promise<void> {
  await requireSession();
  await deleteTask(id);
  redirect("/tasks");
}
