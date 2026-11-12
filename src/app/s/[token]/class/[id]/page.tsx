import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { KindBadge, timeRange } from "@/components/classes";
import { Loading } from "@/components/ui";
import { getClass } from "@/lib/data/classes";
import { getSubject } from "@/lib/data/subjects";
import { formatDate, relativeDue } from "@/lib/dates";
import { isUuid } from "@/lib/ids";
import { PublicBadge, PublicSubjectOverview, publicHref, requireScheduleToken } from "../../shared";

export default function PublicClassPage({ params }: PageProps<"/s/[token]/class/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <ClassDetails params={params} />
    </Suspense>
  );
}

async function ClassDetails({ params }: { params: PageProps<"/s/[token]/class/[id]">["params"] }) {
  await connection();
  const { token, id } = await params;
  await requireScheduleToken(token);
  if (!isUuid(id)) notFound();
  const session = await getClass(id);
  if (!session) notFound();
  const subject = session.subject_id ? await getSubject(session.subject_id) : null;
  const href = publicHref(token);
  const cancelled = session.status === "cancelled";

  return (
    <article>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <Link href={href.schedule(session.date)} className="text-accent">← Розклад</Link>
        <PublicBadge />
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {subject ? <Link href={href.subject(subject.id)} className="hover:text-accent">{subject.name}</Link> : "Без предмета"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <KindBadge kind={session.kind} />
          <span className={cancelled ? "text-muted line-through" : "font-medium"}>
            {formatDate(session.date)}
            {timeRange(session) && `, ${timeRange(session)}`}
          </span>
          <span className="text-muted">{relativeDue(session.date)}</span>
          {cancelled && <span className="text-danger">скасовано</span>}
          {session.teacher_name && <span className="text-muted">{session.teacher_name}</span>}
          {session.location && <span className="text-muted">{session.location}</span>}
        </div>
      </header>
      {subject && <PublicSubjectOverview subject={subject} token={token} currentClassId={session.id} />}
    </article>
  );
}
