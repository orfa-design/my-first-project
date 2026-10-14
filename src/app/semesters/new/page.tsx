import type { Metadata } from "next";
import { SemesterForm } from "@/components/semester-form";
import { PageHeader } from "@/components/ui";
import { createSemesterAction } from "../actions";

export const metadata: Metadata = { title: "Новий семестр" };

export default function NewSemesterPage() {
  return (
    <>
      <PageHeader title="Новий семестр" />
      <SemesterForm action={createSemesterAction} />
    </>
  );
}
