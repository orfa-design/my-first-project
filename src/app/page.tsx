import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Мій простір" };

// Стартова сторінка: окремі розділи-підпроєкти, кожен зі своїм меню.
const SECTIONS = [
  {
    href: "/study",
    emoji: "🎓",
    title: "Study Hub",
    text: "Навчання: розклад, завдання, предмети, оцінки.",
  },
  {
    href: "/wishlist",
    emoji: "🎁",
    title: "Вішліст",
    text: "Список бажань і публічне посилання для того, хто вибирає подарунок.",
  },
];

export default function HomePage() {
  return (
    <>
      <PageHeader title="Мій простір" />
      <ul className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="card block h-full p-5 hover:border-accent">
              <div className="mb-2 text-3xl">{s.emoji}</div>
              <div className="text-lg font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
