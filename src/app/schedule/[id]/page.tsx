import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClassForm } from "@/components/class-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Loading, PageHeader, Prose, Section } from "@/components/ui";
import { getClass } from "@/lib/data/classes";
import { listSubjects } from "@/lib/data/subjects";
import { formatDate } from "@/lib/dates";
import { isUuid } from "@/lib/ids";
import { CLASS_KIND_LABELS } from "@/lib/labels";
import { deleteClassAction, updateClassAction } from "../actions";

export default function ClassPage({ params }: PageProps<"/schedule/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <ClassDetails params={params} />
    </Suspense>
  );
}

async function ClassDetails({ params }: { params: PageProps<"/schedule/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [session, subjects] = await Promise.all([getClass(id), listSubjects()]);
  if (!session) notFound();

  return (
    <>
      <div className="mb-1 text-sm">
        <Link href={`/schedule?week=${session.date}`} className="text-accent">← Розклад</Link>
        {session.subject_id && (
          <>
            <span className="text-muted"> · </span>
            <Link href={`/subjects/${session.subject_id}`} className="text-accent">{session.subject_name}</Link>
          </>
        )}
      </div>
      <PageHeader
        title={`${CLASS_KIND_LABELS[session.kind]}, ${formatDate(session.date)}`}
        actions={
          <form action={deleteClassAction.bind(null, id, session.date)}>
            <ConfirmButton message="Видалити заняття з розкладу? Якщо його просто скасували, краще позначте «Заняття скасовано»." className="btn-danger">
              Видалити
            </ConfirmButton>
          </form>
        }
      />
      <ClassForm action={updateClassAction.bind(null, id)} subjects={subjects} session={session} />
      {(session.source_text || session.source_url) && (
        <div className="mt-8">
          <Section title="Джерело">
            <div className="card space-y-2 p-4">
              {session.source_url && (
                <a href={session.source_url} target="_blank" rel="noreferrer" className="block break-all text-sm text-accent">
                  {session.source_url}
                </a>
              )}
              {session.source_text && <Prose>{session.source_text}</Prose>}
            </div>
          </Section>
        </div>
      )}
    </>
  );
}
