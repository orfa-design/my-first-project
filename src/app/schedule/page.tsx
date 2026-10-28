import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClassDay } from "@/components/classes";
import { Empty, Loading, PageHeader } from "@/components/ui";
import { listClasses, nextClassDate } from "@/lib/data/classes";
import { addDays, formatDate, mondayOf, todayKyiv } from "@/lib/dates";

export const metadata: Metadata = { title: "Розклад" };

export default function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  return (
    <>
      <PageHeader title="Розклад" actions={<Link href="/schedule/new" className="btn-primary">+ Заняття</Link>} />
      <Suspense fallback={<Loading />}>
        <Week searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Week({ searchParams }: { searchParams: PageProps<"/schedule">["searchParams"] }) {
  await connection();
  const params = await searchParams;
  const weekParam = Array.isArray(params.week) ? params.week[0] : params.week;
  const today = todayKyiv();

  // Без параметра — тиждень із найближчим заняттям (заочникам це зручніше, ніж порожній поточний тиждень).
  const anchor = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekParam : ((await nextClassDate(today)) ?? today);
  const monday = mondayOf(anchor);
  const sunday = addDays(monday, 6);
  const classes = await listClasses({ from: monday, to: sunday });

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  // Неділю показуємо, лише якщо в неї є заняття.
  const shown = days.filter((d, i) => i < 6 || classes.some((c) => c.date === d));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">
          {formatDate(monday)} — {formatDate(sunday)}
        </div>
        <div className="flex gap-2">
          <Link href={`/schedule?week=${addDays(monday, -7)}`} className="btn-secondary" aria-label="Попередній тиждень">←</Link>
          <Link href={`/schedule?week=${today}`} className="btn-secondary">Цей тиждень</Link>
          <Link href={`/schedule?week=${addDays(monday, 7)}`} className="btn-secondary" aria-label="Наступний тиждень">→</Link>
        </div>
      </div>
      {classes.length === 0 && (
        <div className="mb-4">
          <Empty>
            Цього тижня занять немає. Надішліть Claude розклад — він додасть заняття на конкретні дати.
          </Empty>
        </div>
      )}
      {classes.length > 0 && (
        <div className="space-y-4">
          {shown.map((date) => (
            <ClassDay key={date} date={date} classes={classes.filter((c) => c.date === date)} />
          ))}
        </div>
      )}
    </>
  );
}
