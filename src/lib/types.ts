import type { ChecklistItem, TaskStatus } from "./schemas";

export type Semester = {
  id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  session_starts_on: string | null;
  session_ends_on: string | null;
  is_current: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Subject = {
  id: string;
  semester_id: string | null;
  name: string;
  code: string | null;
  teacher_name: string | null;
  teacher_contacts: string | null;
  control_form: "exam" | "credit" | "diff_credit" | "other" | null;
  grading_rules: string | null;
  admission_requirements: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Task = {
  id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  status: TaskStatus;
  priority: "low" | "normal" | "high" | null;
  submission_info: string | null;
  result: string | null;
  checklist: ChecklistItem[];
  source_text: string | null;
  source_url: string | null;
  needs_review: boolean;
  created_at: Date;
  updated_at: Date;
};

/** Завдання разом із назвою предмета — для списків. */
export type TaskWithSubject = Task & { subject_name: string | null };
