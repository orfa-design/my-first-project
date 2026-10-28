import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { SubjectOverview } from "@/components/subject-overview";
import { Loading } from "@/components/ui";
import { getSubject } from "@/lib/data/subjects";
import { isUuid } from "@/lib/ids";
import { deleteSubjectAction } from "../actions";

export default function SubjectPage({ params }: PageProps<"/subjects/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <SubjectDetails params={params} />
    </Suspense>
  );
}

async function SubjectDetails({ params }: { params: PageProps<"/subjects/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const subject = await getSubject(id);
  if (!subject) notFound();

  return (
    <article>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{subject.name}</h1>
        <div className="flex gap-2">
          <Link href={`/subjects/${id}/edit`} className="btn-secondary">Редагувати</Link>
          <form action={deleteSubjectAction.bind(null, id)}>
            <ConfirmButton message="Видалити предмет? Завдання залишаться, але без предмета." className="btn-danger">
              Видалити
            </ConfirmButton>
          </form>
        </div>
      </header>

      <SubjectOverview subject={subject} />
    </article>
  );
}
