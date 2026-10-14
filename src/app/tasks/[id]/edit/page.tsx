import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { TaskForm } from "@/components/task-form";
import { Loading, PageHeader } from "@/components/ui";
import { listSubjects } from "@/lib/data/subjects";
import { getTask } from "@/lib/data/tasks";
import { isUuid } from "@/lib/ids";
import { updateTaskAction } from "../../actions";

export const metadata: Metadata = { title: "Редагування завдання" };

export default function EditTaskPage({ params }: PageProps<"/tasks/[id]/edit">) {
  return (
    <>
      <PageHeader title="Редагування завдання" />
      <Suspense fallback={<Loading />}>
        <EditTaskForm params={params} />
      </Suspense>
    </>
  );
}

async function EditTaskForm({ params }: { params: PageProps<"/tasks/[id]/edit">["params"] }) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [task, subjects] = await Promise.all([getTask(id), listSubjects()]);
  if (!task) notFound();
  return <TaskForm action={updateTaskAction.bind(null, id)} subjects={subjects} task={task} />;
}
