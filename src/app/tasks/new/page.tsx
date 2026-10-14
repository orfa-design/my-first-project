import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { TaskForm } from "@/components/task-form";
import { Loading, PageHeader } from "@/components/ui";
import { listSubjects } from "@/lib/data/subjects";
import { createTaskAction } from "../actions";

export const metadata: Metadata = { title: "Нове завдання" };

export default function NewTaskPage({ searchParams }: PageProps<"/tasks/new">) {
  return (
    <>
      <PageHeader title="Нове завдання" />
      <Suspense fallback={<Loading />}>
        <NewTaskForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewTaskForm({ searchParams }: { searchParams: PageProps<"/tasks/new">["searchParams"] }) {
  await connection();
  const { subject } = await searchParams;
  const subjects = await listSubjects();
  return (
    <TaskForm
      action={createTaskAction}
      subjects={subjects}
      defaultSubjectId={typeof subject === "string" ? subject : undefined}
    />
  );
}
