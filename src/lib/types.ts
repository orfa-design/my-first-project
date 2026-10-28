import type { ChecklistItem, ClassKind, ClassStatus, TaskStatus } from "./schemas";

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

export type ClassSession = {
  id: string;
  subject_id: string | null;
  date: string;
  starts_at: string | null;
  ends_at: string | null;
  kind: ClassKind;
  teacher_name: string | null;
  location: string | null;
  status: ClassStatus;
  notes: string | null;
  source_text: string | null;
  source_url: string | null;
  needs_review: boolean;
  created_at: Date;
  updated_at: Date;
};

export type ClassSessionWithSubject = ClassSession & {
  subject_name: string | null;
  /** Завдання предмета за станом — щоб у розкладі було видно, що по ньому треба зробити і що вже здано. */
  subject_open_tasks: number;
  subject_submitted_tasks: number;
  subject_completed_tasks: number;
};

export type Assessment = {
  id: string;
  subject_id: string | null;
  task_id: string | null;
  class_session_id: string | null;
  title: string;
  /** numeric повертається рядком, щоб не втратити точність. */
  score: string | null;
  max_score: string | null;
  result_text: string | null;
  assessed_on: string | null;
  teacher_comment: string | null;
  source_text: string | null;
  source_url: string | null;
  needs_review: boolean;
  created_at: Date;
  updated_at: Date;
};

export type AssessmentWithSubject = Assessment & { subject_name: string | null };
