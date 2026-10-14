import { z } from "zod";
import { getDashboard } from "./data/dashboard";
import {
  createSemester,
  getCurrentSemester,
  getSemester,
  listSemesters,
  updateSemester,
} from "./data/semesters";
import {
  createSubject,
  deleteSubject,
  findSimilarSubjects,
  getSubject,
  listSubjects,
  updateSubject,
} from "./data/subjects";
import {
  createTask,
  deleteTask,
  findSimilarTasks,
  getTask,
  listTasks,
  updateTask,
  type DueFilter,
} from "./data/tasks";
import {
  semesterInput,
  semesterPatch,
  subjectInput,
  subjectPatch,
  TASK_STATUSES,
  taskInput,
  taskPatch,
  type TaskStatus,
} from "./schemas";

// Команди, якими AI читає й змінює дані Study Hub.
// Викликаються з CLI (scripts/hub.ts) локально або через POST /api/hub.

const HELP = `Study Hub CLI. Використання: npm run hub -- <команда> [аргументи]

  summary                                 Зведення стану навчання (як на Dashboard)

  semester list | current | get <id>
  semester create '<json>'                Поля: name, starts_on, ends_on, session_starts_on, session_ends_on, is_current, notes
  semester update <id> '<json>'

  subject list [--semester <id>]
  subject find "<назва>"                  Пошук схожих (перед створенням!)
  subject get <id>                        Предмет + його завдання
  subject create '<json>' [--force]       Поля: name, code, semester_id, teacher_name, teacher_contacts,
                                          control_form (exam|credit|diff_credit|other), grading_rules,
                                          admission_requirements, notes
  subject update <id> '<json>'            Лише передані поля; null очищає поле
  subject delete <id>

  task list [--subject <id>] [--status a,b] [--due overdue|week|upcoming|none] [--open] [--q "<текст>"]
  task find "<назва>" [--subject <id>]   Пошук схожих (перед створенням!)
  task get <id>
  task create '<json>' [--force]          Поля: title, subject_id, description, due_date (YYYY-MM-DD), due_time (HH:MM),
                                          status (${TASK_STATUSES.join("|")}),
                                          priority (low|normal|high), submission_info, result,
                                          checklist [{text, done}], source_text, source_url, needs_review
  task update <id> '<json>'
  task delete <id>

  '<json>' можна замінити на "-" і передати JSON через stdin.
  create без --force відмовляє, якщо знайдено схожий запис (код виходу 2).`;

export class HubError extends Error {
  constructor(
    message: string,
    public code = 1,
    public details?: unknown,
  ) {
    super(message);
  }
}

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function readJson(arg: string | undefined, stdin: string | undefined): unknown {
  if (arg === undefined) throw new HubError("Очікувався JSON-аргумент");
  if (arg === "-" && stdin === undefined) throw new HubError("Очікувався JSON у stdin");
  const text = arg === "-" ? stdin! : arg;
  try {
    return JSON.parse(text);
  } catch {
    throw new HubError("Некоректний JSON");
  }
}

function validate<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HubError("Помилка валідації", 1, z.treeifyError(result.error));
  }
  return result.data;
}

function need(value: string | undefined, what: string): string {
  if (!value) throw new HubError(`Не вказано ${what}`);
  return value;
}

function flag(flags: Record<string, string | true>, key: string): string | undefined {
  const v = flags[key];
  return typeof v === "string" ? v : undefined;
}

function orNotFound<T>(row: T | null, what: string): T {
  if (!row) throw new HubError(`${what} не знайдено`, 3);
  return row;
}

// Поріг схожості, від якого create вважає запис можливим дублікатом.
const DUPLICATE_SCORE = 0.5;

/** Виконує команду. stdin — вміст для аргументу «-». */
export async function runHubCommand(argv: string[], stdin?: string): Promise<unknown> {
  const { positional, flags } = parseArgs(argv);
  const [entity, action, a1, a2] = positional;

  switch (entity) {
    case undefined:
    case "help":
      return HELP;

    case "summary":
      return getDashboard();

    case "semester":
      switch (action) {
        case "list":
          return listSemesters();
        case "current":
          return getCurrentSemester();
        case "get":
          return orNotFound(await getSemester(need(a1, "id")), "Семестр");
        case "create":
          return createSemester(validate(semesterInput, readJson(a1, stdin)));
        case "update":
          return orNotFound(await updateSemester(need(a1, "id"), validate(semesterPatch, readJson(a2, stdin))), "Семестр");
      }
      break;

    case "subject":
      switch (action) {
        case "list":
          return listSubjects(flag(flags, "semester"));
        case "find":
          return findSimilarSubjects(need(a1, "назву"));
        case "get": {
          const subject = orNotFound(await getSubject(need(a1, "id")), "Предмет");
          return { ...subject, tasks: await listTasks({ subjectId: subject.id }) };
        }
        case "create": {
          const input = validate(subjectInput, readJson(a1, stdin));
          if (!flags.force) {
            const similar = (await findSimilarSubjects(input.name)).filter((s) => s.score >= DUPLICATE_SCORE);
            if (similar.length) {
              throw new HubError("Знайдено схожі предмети. Оновіть наявний або повторіть з --force.", 2, similar);
            }
          }
          return createSubject(input);
        }
        case "update":
          return orNotFound(await updateSubject(need(a1, "id"), validate(subjectPatch, readJson(a2, stdin))), "Предмет");
        case "delete":
          await deleteSubject(need(a1, "id"));
          return { deleted: a1 };
      }
      break;

    case "task":
      switch (action) {
        case "list": {
          const statuses = flag(flags, "status")?.split(",") as TaskStatus[] | undefined;
          if (statuses?.some((s) => !TASK_STATUSES.includes(s))) {
            throw new HubError(`Невідомий статус. Допустимі: ${TASK_STATUSES.join(", ")}`);
          }
          return listTasks({
            subjectId: flag(flags, "subject"),
            statuses,
            due: flag(flags, "due") as DueFilter | undefined,
            openOnly: flags.open === true,
            q: flag(flags, "q"),
          });
        }
        case "find":
          return findSimilarTasks(need(a1, "назву"), flag(flags, "subject"));
        case "get":
          return orNotFound(await getTask(need(a1, "id")), "Завдання");
        case "create": {
          const input = validate(taskInput, readJson(a1, stdin));
          if (!flags.force) {
            const similar = (await findSimilarTasks(input.title, input.subject_id)).filter(
              (t) => t.score >= DUPLICATE_SCORE,
            );
            if (similar.length) {
              throw new HubError("Знайдено схожі завдання. Оновіть наявне або повторіть з --force.", 2, similar);
            }
          }
          return createTask(input);
        }
        case "update":
          return orNotFound(await updateTask(need(a1, "id"), validate(taskPatch, readJson(a2, stdin))), "Завдання");
        case "delete":
          await deleteTask(need(a1, "id"));
          return { deleted: a1 };
      }
      break;
  }

  throw new HubError(`Невідома команда: ${positional.join(" ")}\n\n${HELP}`);
}

