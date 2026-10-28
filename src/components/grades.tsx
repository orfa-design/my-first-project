import Link from "next/link";
import { formatDate } from "@/lib/dates";
import type { AssessmentWithSubject } from "@/lib/types";

/** «18 / 20», «18», «зараховано» або «18 / 20 · зараховано». Без оцінки — «—», а не нуль. */
export function gradeText(a: Pick<AssessmentWithSubject, "score" | "max_score" | "result_text">): string {
  const score = a.score !== null ? (a.max_score !== null ? `${Number(a.score)} / ${Number(a.max_score)}` : `${Number(a.score)}`) : "";
  return [score, a.result_text].filter(Boolean).join(" · ") || "—";
}

export function GradeList({ grades, showSubject = true }: { grades: AssessmentWithSubject[]; showSubject?: boolean }) {
  return (
    <ul className="card divide-y divide-border">
      {grades.map((g) => (
        <li key={g.id}>
          <Link href={`/grades/${g.id}`} className="flex items-baseline gap-4 px-4 py-3 hover:bg-surface-muted">
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {g.title}
                {g.needs_review && <span className="ml-2 text-xs font-normal text-warn">перевірити</span>}
              </div>
              <div className="text-sm text-muted">
                {showSubject && <>{g.subject_name ?? "Без предмета"}</>}
                {showSubject && g.assessed_on && " · "}
                {g.assessed_on && formatDate(g.assessed_on)}
              </div>
            </div>
            <span className="shrink-0 font-medium tabular-nums">{gradeText(g)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
