import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Empty, Loading, PageHeader, TaskList } from "@/components/ui";
import { listSubjects } from "@/lib/data/subjects";
import { listTasks, type DueFilter, type TaskSort } from "@/lib/data/tasks";
import { STATUS_LABELS } from "@/lib/labels";
import { TASK_STATUSES, type TaskStatus } from "@/lib/schemas";

export const metadata: Metadata = { title: "Завдання" };

const DUE_OPTIONS: { value: DueFilter | ""; label: string }[] = [
  { value: "", label: "Будь-який дедлайн" },
  { value: "overdue", label: "Прострочені" },
  { value: "week", label: "Наступні 7 днів" },
  { value: "upcoming", label: "Майбутні" },
  { value: "none", label: "Без дедлайну" },
];

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: "due", label: "За дедлайном" },
  { value: "subject", label: "За предметом" },
  { value: "created", label: "Нові спочатку" },
];

export default function TasksPage({ searchParams }: PageProps<"/tasks">) {
  return (
    <>
      <PageHeader title="Завдання" actions={<Link href="/tasks/new" className="btn-primary">+ Завдання</Link>} />
      <Suspense fallback={<Loading />}>
        <TasksContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TasksContent({ searchParams }: { searchParams: PageProps<"/tasks">["searchParams"] }) {
  await connection();
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

  const subjectId = one(params.subject);
  const statusParam = one(params.status);
  const due = one(params.due) as DueFilter | undefined;
  const q = one(params.q);
  const sortParam = one(params.sort);
  const sort: TaskSort = SORT_OPTIONS.some((o) => o.value === sortParam) ? (sortParam as TaskSort) : "due";
  // За замовчуванням показуємо незавершені; «all» — усі.
  const status = statusParam ?? "open";
  const statuses = TASK_STATUSES.includes(status as TaskStatus) ? [status as TaskStatus] : undefined;

  const [tasks, subjects] = await Promise.all([
    listTasks({ subjectId, statuses, openOnly: status === "open", due, q, sort }),
    listSubjects(),
  ]);

  return (
    <>
      <form className="mb-4 flex flex-wrap gap-2 [&>select]:sm:w-auto [&>select]:sm:max-w-56">
        <input name="q" defaultValue={q} placeholder="Пошук…" className="input sm:w-auto sm:min-w-48 sm:flex-1" />
        <select name="subject" defaultValue={subjectId ?? ""} className="input">
          <option value="">Усі предмети</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="input">
          <option value="open">Незавершені</option>
          <option value="all">Усі статуси</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select name="due" defaultValue={due ?? ""} className="input">
          {DUE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="input" aria-label="Сортування">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button className="btn-secondary">Показати</button>
      </form>
      {tasks.length ? (
        <TaskList tasks={tasks} />
      ) : (
        <Empty>
          {subjectId || q || due || statusParam
            ? "За цими фільтрами нічого не знайдено."
            : "Завдань ще немає. Перешліть Claude оголошення викладача — він створить завдання з дедлайном."}
        </Empty>
      )}
    </>
  );
}
