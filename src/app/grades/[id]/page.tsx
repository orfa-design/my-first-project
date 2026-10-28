import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { GradeForm } from "@/components/grade-form";
import { Loading, PageHeader, Prose, Section } from "@/components/ui";
import { getAssessment } from "@/lib/data/assessments";
import { listSubjects } from "@/lib/data/subjects";
import { isUuid } from "@/lib/ids";
import { deleteGradeAction, updateGradeAction } from "../actions";

export default function GradePage({ params }: PageProps<"/grades/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <GradeDetails params={params} />
    </Suspense>
  );
}

async function GradeDetails({ params }: { params: PageProps<"/grades/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [grade, subjects] = await Promise.all([getAssessment(id), listSubjects()]);
  if (!grade) notFound();

  return (
    <>
      <div className="mb-1 text-sm">
        <Link href="/grades" className="text-accent">← Оцінки</Link>
        {grade.subject_id && (
          <>
            <span className="text-muted"> · </span>
            <Link href={`/subjects/${grade.subject_id}`} className="text-accent">{grade.subject_name}</Link>
          </>
        )}
      </div>
      <PageHeader
        title={grade.title}
        actions={
          <form action={deleteGradeAction.bind(null, id)}>
            <ConfirmButton message="Видалити оцінку з журналу?" className="btn-danger">Видалити</ConfirmButton>
          </form>
        }
      />
      <GradeForm action={updateGradeAction.bind(null, id)} subjects={subjects} grade={grade} />
      {(grade.source_text || grade.source_url) && (
        <div className="mt-8">
          <Section title="Джерело">
            <div className="card space-y-2 p-4">
              {grade.source_url && (
                <a href={grade.source_url} target="_blank" rel="noreferrer" className="block break-all text-sm text-accent">
                  {grade.source_url}
                </a>
              )}
              {grade.source_text && <Prose>{grade.source_text}</Prose>}
            </div>
          </Section>
        </div>
      )}
    </>
  );
}
