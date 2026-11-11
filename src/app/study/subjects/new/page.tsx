import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SubjectForm } from "@/components/subject-form";
import { Loading, PageHeader } from "@/components/ui";
import { listSemesters } from "@/lib/data/semesters";
import { createSubjectAction } from "../actions";

export const metadata: Metadata = { title: "Новий предмет" };

export default function NewSubjectPage() {
  return (
    <>
      <PageHeader title="Новий предмет" />
      <Suspense fallback={<Loading />}>
        <NewSubjectForm />
      </Suspense>
    </>
  );
}

async function NewSubjectForm() {
  await connection();
  return <SubjectForm action={createSubjectAction} semesters={await listSemesters()} />;
}
