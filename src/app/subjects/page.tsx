import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Empty, Loading, PageHeader } from "@/components/ui";
import { getCurrentSemester, listSemesters } from "@/lib/data/semesters";
import { listSubjects } from "@/lib/data/subjects";
import { CONTROL_FORM_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Предмети" };

export default function SubjectsPage() {
  return (
    <>
      <PageHeader title="Предмети" actions={<Link href="/subjects/new" className="btn-primary">+ Предмет</Link>} />
      <Suspense fallback={<Loading />}>
        <SubjectsContent />
      </Suspense>
    </>
  );
}

async function SubjectsContent() {
  await connection();
  const [subjects, semesters, current] = await Promise.all([listSubjects(), listSemesters(), getCurrentSemester()]);

  if (!subjects.length) {
    return (
      <Empty>
        Предметів ще немає. Надішліть Claude список предметів семестру або{" "}
        <Link href="/subjects/new" className="text-accent underline">додайте предмет</Link> вручну.
      </Empty>
    );
  }

  // Групуємо за семестром: поточний — першим, предмети без семестру — наприкінці.
  const groups = [
    ...semesters
      .slice()
      .sort((a, b) => Number(b.id === current?.id) - Number(a.id === current?.id))
      .map((sem) => ({ key: sem.id, title: sem.name, items: subjects.filter((s) => s.semester_id === sem.id) })),
    { key: "none", title: "Без семестру", items: subjects.filter((s) => !s.semester_id) },
  ].filter((g) => g.items.length);

  return (
    <>
      {groups.map((group) => (
        <section key={group.key} className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {group.title}
            {group.key === current?.id && <span className="ml-2 font-normal normal-case">поточний</span>}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {group.items.map((s) => (
              <li key={s.id}>
                <Link href={`/subjects/${s.id}`} className="card block h-full p-4 hover:border-accent">
                  <div className="font-medium">{s.name}</div>
                  <div className="mt-1 text-sm text-muted">
                    {[s.control_form && CONTROL_FORM_LABELS[s.control_form], s.teacher_name].filter(Boolean).join(" · ") || " "}
                  </div>
                  <div className="mt-3 text-sm">
                    {s.open_tasks > 0 ? (
                      <span>{s.open_tasks} незавершених завдань</span>
                    ) : (
                      <span className="text-muted">{s.total_tasks ? "усі завдання закрито" : "завдань немає"}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
