import { z } from "zod";

// Спільні схеми для форм вебзастосунку та CLI для AI (scripts/hub.ts).
// Усі поля, крім назви, необов'язкові: невідоме просто не заповнюється.

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullish();

const isoDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата має бути у форматі РРРР-ММ-ДД").nullable())
  .nullish();

const time = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Час має бути у форматі ГГ:ХХ").nullable())
  .nullish();

const optionalId = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.uuid("Некоректний ідентифікатор").nullable())
  .nullish();

export const TASK_STATUSES = ["not_started", "in_progress", "submitted", "completed", "needs_revision"] as const;
export const OPEN_TASK_STATUSES = ["not_started", "in_progress", "needs_revision"] as const;
export const PRIORITIES = ["low", "normal", "high"] as const;
export const CONTROL_FORMS = ["exam", "credit", "diff_credit", "other"] as const;
export const CLASS_KINDS = ["lecture", "practice", "lab", "consultation", "exam", "credit", "diff_credit", "other"] as const;
/** Види занять, що є підсумковим контролем (екзамен, залік). */
export const CONTROL_KINDS = ["exam", "credit", "diff_credit"] as const;
export const CLASS_STATUSES = ["scheduled", "cancelled"] as const;

const emptyToNull = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema.nullish());

export const semesterInput = z.object({
  name: z.string().trim().min(1, "Вкажіть назву семестру"),
  starts_on: isoDate,
  ends_on: isoDate,
  session_starts_on: isoDate,
  session_ends_on: isoDate,
  is_current: z.boolean().optional(),
  notes: optionalText,
});

export const subjectInput = z.object({
  semester_id: optionalId,
  name: z.string().trim().min(1, "Вкажіть назву предмета"),
  code: optionalText,
  teacher_name: optionalText,
  teacher_contacts: optionalText,
  control_form: emptyToNull(z.enum(CONTROL_FORMS)),
  grading_rules: optionalText,
  admission_requirements: optionalText,
  notes: optionalText,
});

export const checklistItem = z.object({
  text: z.string().trim().min(1),
  done: z.boolean().default(false),
});

// Поля без значень за замовчуванням: потрібні для часткових оновлень,
// інакше .partial() підставив би status/checklist і перезаписав наявні дані.
const taskFields = z.object({
  subject_id: optionalId,
  title: z.string().trim().min(1, "Вкажіть назву завдання"),
  description: optionalText,
  due_date: isoDate,
  due_time: time,
  status: z.enum(TASK_STATUSES),
  priority: emptyToNull(z.enum(PRIORITIES)),
  submission_info: optionalText,
  result: optionalText,
  checklist: z.array(checklistItem),
  source_text: optionalText,
  source_url: optionalText,
  needs_review: z.boolean(),
});

export const taskInput = taskFields.extend({
  status: taskFields.shape.status.default("not_started"),
  checklist: taskFields.shape.checklist.default([]),
  needs_review: taskFields.shape.needs_review.default(false),
});

const requiredDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата має бути у форматі РРРР-ММ-ДД");

const optionalNumber = z.preprocess(
  (v) => (v === "" ? null : typeof v === "string" ? Number(v.replace(",", ".")) : v),
  z.number({ error: "Має бути число" }).finite().nullish(),
);

const classSessionFields = z.object({
  subject_id: optionalId,
  date: requiredDate,
  starts_at: time,
  ends_at: time,
  kind: z.enum(CLASS_KINDS),
  teacher_name: optionalText,
  location: optionalText,
  status: z.enum(CLASS_STATUSES),
  notes: optionalText,
  source_text: optionalText,
  source_url: optionalText,
  needs_review: z.boolean(),
});

export const classSessionInput = classSessionFields.extend({
  kind: classSessionFields.shape.kind.default("other"),
  status: classSessionFields.shape.status.default("scheduled"),
  needs_review: classSessionFields.shape.needs_review.default(false),
});

const assessmentFields = z.object({
  subject_id: optionalId,
  task_id: optionalId,
  class_session_id: optionalId,
  title: z.string().trim().min(1, "Вкажіть, що оцінювали"),
  score: optionalNumber,
  max_score: optionalNumber,
  result_text: optionalText,
  assessed_on: isoDate,
  teacher_comment: optionalText,
  source_text: optionalText,
  source_url: optionalText,
  needs_review: z.boolean(),
});

export const assessmentInput = assessmentFields.extend({
  needs_review: assessmentFields.shape.needs_review.default(false),
});

export const taskPatch = taskFields.partial();
export const classSessionPatch = classSessionFields.partial();
export const assessmentPatch = assessmentFields.partial();
export const subjectPatch = subjectInput.partial();
export const semesterPatch = semesterInput.partial();

export type SemesterInput = z.infer<typeof semesterInput>;
export type SubjectInput = z.infer<typeof subjectInput>;
export type TaskInput = z.infer<typeof taskInput>;
export type TaskPatch = z.infer<typeof taskPatch>;
export type SubjectPatch = z.infer<typeof subjectPatch>;
export type SemesterPatch = z.infer<typeof semesterPatch>;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type ClassSessionInput = z.infer<typeof classSessionInput>;
export type ClassSessionPatch = z.infer<typeof classSessionPatch>;
export type AssessmentInput = z.infer<typeof assessmentInput>;
export type AssessmentPatch = z.infer<typeof assessmentPatch>;
export type ClassKind = (typeof CLASS_KINDS)[number];
export type ClassStatus = (typeof CLASS_STATUSES)[number];
export type ChecklistItem = z.infer<typeof checklistItem>;

/** Перше повідомлення про помилку валідації — для показу у формі. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? issue.message : "Некоректні дані";
}
