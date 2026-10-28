import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { GradeList } from "@/components/grades";
import { Empty, Loading, PageHeader, Section } from "@/components/ui";
import { listAssessments } from "@/lib/data/assessments";
import type { AssessmentWithSubject } from "@/lib/types";

export const metadata: Metadata = { title: "Оцінки" };

export default function GradesPage() {
  return (
    <>
      <PageHeader title="Оцінки" actions={<Link href="/grades/new" className="btn-primary">+ Оцінка</Link>}>
        Журнал оцінювання за предметами. Середній бал не рахуємо, поки невідомі правила.
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <Grades />
      </Suspense>
    </>
  );
}

async function Grades() {
  await connection();
  const grades = await listAssessments();
  if (!grades.length) {
    return <Empty>Оцінок ще немає. Перешліть Claude повідомлення з результатом — він внесе його в журнал.</Empty>;
  }

  const bySubject = new Map<string, AssessmentWithSubject[]>();
  for (const g of grades) {
    const key = g.subject_name ?? "Без предмета";
    bySubject.set(key, [...(bySubject.get(key) ?? []), g]);
  }
  return (
    <>
      {[...bySubject].sort(([a], [b]) => a.localeCompare(b, "uk")).map(([name, items]) => (
        <Section key={name} title={name} count={items.length}>
          <GradeList grades={items} showSubject={false} />
        </Section>
      ))}
    </>
  );
}
