import type { ChecklistItem } from "./schemas";

export type FormState = { error?: string };

/** Текстові поля форми як об'єкт; відсутні поля не потрапляють у результат. */
export function pickFields(formData: FormData, fields: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string") out[field] = value;
  }
  return out;
}

/**
 * Чекліст редагується як текст: один пункт на рядок, «[x] » на початку — виконаний.
 */
export function parseChecklist(text: string): ChecklistItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^\[(x|х| )\]\s*/i.exec(line);
      return match
        ? { text: line.slice(match[0].length), done: match[1].trim() !== "" }
        : { text: line, done: false };
    })
    .filter((item) => item.text);
}

export function checklistToText(items: ChecklistItem[]): string {
  return items.map((i) => `${i.done ? "[x] " : ""}${i.text}`).join("\n");
}
