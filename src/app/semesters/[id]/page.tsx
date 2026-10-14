import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { SemesterForm } from "@/components/semester-form";
import { Loading, PageHeader } from "@/components/ui";
import { getSemester } from "@/lib/data/semesters";
import { isUuid } from "@/lib/ids";
import { deleteSemesterAction, updateSemesterAction } from "../actions";

export default function EditSemesterPage({ params }: PageProps<"/semesters/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <EditSemester params={params} />
    </Suspense>
  );
}

async function EditSemester({ params }: { params: PageProps<"/semesters/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const semester = await getSemester(id);
  if (!semester) notFound();
  return (
    <>
      <PageHeader
        title={semester.name}
        actions={
          <form action={deleteSemesterAction.bind(null, id)}>
            <ConfirmButton message="Видалити семестр? Предмети залишаться без семестру." className="btn-danger">
              Видалити
            </ConfirmButton>
          </form>
        }
      />
      <SemesterForm action={updateSemesterAction.bind(null, id)} semester={semester} />
    </>
  );
}
