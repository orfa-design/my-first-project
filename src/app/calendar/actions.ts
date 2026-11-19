"use server";

import { refresh } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  addTodo,
  createEvent,
  deleteEvent,
  deleteTodo,
  removePoster,
  setPoster,
  setTodoDone,
  skipOccurrence,
  unskipOccurrence,
} from "@/lib/data/calendar";
import type { FormState } from "@/lib/form";
import { calEventInput, calTodoInput, firstIssue } from "@/lib/schemas";
import { posterFromFile } from "./poster-file";

const str = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

export async function addEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const repeats = formData.get("repeats") === "on";
  const owner = str(formData, "owner") === "other" ? "other" : "mine";
  const parsed = calEventInput.safeParse({
    title: str(formData, "title"),
    owner,
    person: owner === "other" ? str(formData, "person") : "",
    date: str(formData, "date"),
    // Година й хвилини — окремими списками; без години — подія на весь день.
    time: str(formData, "hour") ? `${str(formData, "hour")}:${str(formData, "minute") || "00"}` : "",
    place: str(formData, "place"),
    note: str(formData, "note"),
    weekdays: repeats ? formData.getAll("weekdays").map(Number) : null,
    repeat_until: repeats ? str(formData, "repeat_until") : "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  if (repeats && !parsed.data.weekdays) return { error: "Оберіть дні тижня, у які подія повторюється" };

  const poster = await posterFromFile(formData.get("poster"));
  if (poster && "error" in poster) return { error: poster.error };

  const event = await createEvent(parsed.data);
  if (poster) await setPoster(event.id, poster.mime, poster.data);
  refresh();
  return {};
}

export async function deleteEventAction(id: string): Promise<void> {
  await requireSession();
  await deleteEvent(id);
  refresh();
}

export async function skipOccurrenceAction(id: string, date: string): Promise<void> {
  await requireSession();
  await skipOccurrence(id, date);
  refresh();
}

export async function unskipOccurrenceAction(id: string, date: string): Promise<void> {
  await requireSession();
  await unskipOccurrence(id, date);
  refresh();
}

export async function setPosterAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const poster = await posterFromFile(formData.get("poster"));
  if (!poster) return { error: "Оберіть картинку" };
  if ("error" in poster) return { error: poster.error };
  await setPoster(id, poster.mime, poster.data);
  refresh();
  return {};
}

export async function removePosterAction(id: string): Promise<void> {
  await requireSession();
  await removePoster(id);
  refresh();
}

export async function addTodoAction(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = calTodoInput.safeParse({ title: str(formData, "title") });
  if (!parsed.success) return;
  await addTodo(parsed.data.title);
  refresh();
}

export async function toggleTodoAction(id: string, done: boolean): Promise<void> {
  await requireSession();
  await setTodoDone(id, done);
  refresh();
}

export async function deleteTodoAction(id: string): Promise<void> {
  await requireSession();
  await deleteTodo(id);
  refresh();
}
