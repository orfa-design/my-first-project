"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "Огляд" },
  { href: "/schedule", label: "Розклад" },
  { href: "/tasks", label: "Завдання" },
  { href: "/subjects", label: "Предмети" },
  { href: "/grades", label: "Оцінки" },
  { href: "/semesters", label: "Семестри" },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-surface md:fixed md:inset-y-0 md:left-0 md:w-52 md:border-b-0 md:border-r">
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 md:flex-col md:items-stretch md:gap-0.5 md:px-3 md:py-5">
        <Link href="/" className="hidden shrink-0 px-2 py-1.5 font-semibold md:mb-4 md:block">
          Study Hub
        </Link>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-md px-2.5 py-1.5 text-sm ${
              isActive(link.href) ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto shrink-0 md:ml-0 md:mt-auto">
          <button className="rounded-md px-2.5 py-1.5 text-sm text-muted hover:text-text md:mt-6">Вийти</button>
        </form>
      </div>
    </nav>
  );
}
