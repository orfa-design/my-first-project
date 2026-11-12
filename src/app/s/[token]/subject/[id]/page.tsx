import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { getSubject } from "@/lib/data/subjects";
import { isUuid } from "@/lib/ids";
import { PublicBadge, PublicSubjectOverview, publicHref, requireScheduleToken } from "../../shared";

export default function PublicSubjectPage({ params }: PageProps<"/s/[token]/subject/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <SubjectDetails params={params} />
    </Suspense>
  );
}

async function SubjectDetails({ params }: { params: PageProps<"/s/[token]/subject/[id]">["params"] }) {
  await connection();
  const { token, id } = await params;
  await requireScheduleToken(token);
  if (!isUuid(id)) notFound();
  const subject = await getSubject(id);
  if (!subject) notFound();

  return (
    <article>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <Link href={publicHref(token).schedule()} className="text-accent">← Розклад</Link>
        <PublicBadge />
      </div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{subject.name}</h1>
      <PublicSubjectOverview subject={subject} token={token} />
    </article>
  );
}
