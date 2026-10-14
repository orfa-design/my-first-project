import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SubjectForm } from "@/components/subject-form";
import { Loading, PageHeader } from "@/components/ui";
import { listSemesters } from "@/lib/data/semesters";
import { getSubject } from "@/lib/data/subjects";
import { isUuid } from "@/lib/ids";
import { updateSubjectAction } from "../../actions";

export const metadata: Metadata = { title: "Редагування предмета" };

export default function EditSubjectPage({ params }: PageProps<"/subjects/[id]/edit">) {
  return (
    <>
      <PageHeader title="Редагування предмета" />
      <Suspense fallback={<Loading />}>
        <EditSubjectForm params={params} />
      </Suspense>
    </>
  );
}

async function EditSubjectForm({ params }: { params: PageProps<"/subjects/[id]/edit">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [subject, semesters] = await Promise.all([getSubject(id), listSemesters()]);
  if (!subject) notFound();
  return <SubjectForm action={updateSubjectAction.bind(null, id)} semesters={semesters} subject={subject} />;
}
