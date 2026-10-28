import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClassForm } from "@/components/class-form";
import { Loading, PageHeader } from "@/components/ui";
import { listSubjects } from "@/lib/data/subjects";
import { createClassAction } from "../actions";

export const metadata: Metadata = { title: "Нове заняття" };

export default function NewClassPage({ searchParams }: PageProps<"/schedule/new">) {
  return (
    <>
      <PageHeader title="Нове заняття" />
      <Suspense fallback={<Loading />}>
        <NewClassForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewClassForm({ searchParams }: { searchParams: PageProps<"/schedule/new">["searchParams"] }) {
  await connection();
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return (
    <ClassForm
      action={createClassAction}
      subjects={await listSubjects()}
      defaults={{ subject_id: one(params.subject), date: one(params.date) }}
    />
  );
}
