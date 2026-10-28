import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { GradeForm } from "@/components/grade-form";
import { Loading, PageHeader } from "@/components/ui";
import { listSubjects } from "@/lib/data/subjects";
import { createGradeAction } from "../actions";

export const metadata: Metadata = { title: "Нова оцінка" };

export default function NewGradePage({ searchParams }: PageProps<"/grades/new">) {
  return (
    <>
      <PageHeader title="Нова оцінка" />
      <Suspense fallback={<Loading />}>
        <NewGradeForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewGradeForm({ searchParams }: { searchParams: PageProps<"/grades/new">["searchParams"] }) {
  await connection();
  const { subject } = await searchParams;
  return (
    <GradeForm
      action={createGradeAction}
      subjects={await listSubjects()}
      defaultSubjectId={(Array.isArray(subject) ? subject[0] : subject) || undefined}
    />
  );
}
