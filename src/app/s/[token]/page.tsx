import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClassDay } from "@/components/classes";
import { Empty, Loading } from "@/components/ui";
import { listClasses, nextClassDate } from "@/lib/data/classes";
import { addDays, formatDate, mondayOf, todayKyiv } from "@/lib/dates";
import { PublicBadge, publicHref, requireScheduleToken } from "./shared";

export default function PublicSchedulePage({ params, searchParams }: PageProps<"/s/[token]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Week params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Week({ params, searchParams }: Pick<PageProps<"/s/[token]">, "params" | "searchParams">) {
  await connection();
  const { token } = await params;
  await requireScheduleToken(token);
  const href = publicHref(token);

  const query = await searchParams;
  const weekParam = Array.isArray(query.week) ? query.week[0] : query.week;
  const today = todayKyiv();
  const anchor = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekParam : ((await nextClassDate(today)) ?? today);
  const monday = mondayOf(anchor);
  const sunday = addDays(monday, 6);
  // Повний розклад: пари закритих предметів теж показуємо — звичайними, без приглушення (це особиста позначка).
  const classes = await listClasses({ from: monday, to: sunday });
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const shown = days.filter((d, i) => i < 6 || classes.some((c) => c.date === d));

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Розклад</h1>
        <PublicBadge />
      </header>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">
          {formatDate(monday)} — {formatDate(sunday)}
        </div>
        <div className="flex gap-2">
          <Link href={href.schedule(addDays(monday, -7))} className="btn-secondary" aria-label="Попередній тиждень">←</Link>
          <Link href={href.schedule(today)} className="btn-secondary">Цей тиждень</Link>
          <Link href={href.schedule(addDays(monday, 7))} className="btn-secondary" aria-label="Наступний тиждень">→</Link>
        </div>
      </div>
      {classes.length === 0 ? (
        <Empty>Цього тижня занять немає.</Empty>
      ) : (
        <div className="space-y-4">
          {shown.map((date) => (
            <ClassDay
              key={date}
              date={date}
              classes={classes.filter((c) => c.date === date)}
              view={{ hrefFor: href.class, publicView: true }}
            />
          ))}
        </div>
      )}
    </>
  );
}
