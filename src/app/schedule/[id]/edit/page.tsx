import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClassForm } from "@/components/class-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Loading, PageHeader } from "@/components/ui";
import { getClass } from "@/lib/data/classes";
import { listSubjects } from "@/lib/data/subjects";
import { isUuid } from "@/lib/ids";
import { deleteClassAction, updateClassAction } from "../../actions";

export const metadata: Metadata = { title: "Редагування заняття" };

export default function EditClassPage({ params }: PageProps<"/schedule/[id]/edit">) {
  return (
    <Suspense fallback={<Loading />}>
      <EditClass params={params} />
    </Suspense>
  );
}

async function EditClass({ params }: { params: PageProps<"/schedule/[id]/edit">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [session, subjects] = await Promise.all([getClass(id), listSubjects()]);
  if (!session) notFound();

  return (
    <>
      <div className="mb-1 text-sm">
        <Link href={`/schedule/${id}`} className="text-accent">← Заняття</Link>
      </div>
      <PageHeader
        title="Редагування заняття"
        actions={
          <form action={deleteClassAction.bind(null, id, session.date)}>
            <ConfirmButton message="Видалити заняття з розкладу? Якщо його просто скасували, краще позначте «Заняття скасовано»." className="btn-danger">
              Видалити
            </ConfirmButton>
          </form>
        }
      />
      <ClassForm action={updateClassAction.bind(null, id)} subjects={subjects} session={session} />
    </>
  );
}
