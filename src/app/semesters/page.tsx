import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Empty, Loading, PageHeader } from "@/components/ui";
import { listSemesters } from "@/lib/data/semesters";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Семестри" };

export default function SemestersPage() {
  return (
    <>
      <PageHeader title="Семестри" actions={<Link href="/semesters/new" className="btn-primary">+ Семестр</Link>}>
        Дати сесії потрібні для відліку на головній сторінці.
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <SemestersContent />
      </Suspense>
    </>
  );
}

const range = (from: string | null, to: string | null) =>
  from || to ? `${from ? formatDate(from) : "?"} — ${to ? formatDate(to) : "?"}` : "невідомо";

async function SemestersContent() {
  await connection();
  const semesters = await listSemesters();
  if (!semesters.length) return <Empty>Семестрів ще немає. Додайте поточний семестр і дати сесії.</Empty>;

  return (
    <ul className="card divide-y divide-border">
      {semesters.map((s) => (
        <li key={s.id}>
          <Link href={`/semesters/${s.id}`} className="block px-4 py-3 hover:bg-surface-muted">
            <div className="font-medium">
              {s.name}
              {s.is_current && <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">поточний</span>}
            </div>
            <div className="mt-1 text-sm text-muted">
              Семестр: {range(s.starts_on, s.ends_on)} · Сесія: {range(s.session_starts_on, s.session_ends_on)}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
