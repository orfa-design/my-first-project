"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

// Сайт складається з окремих розділів (підпроєктів); у кожного своє меню.
type Section = { title: string; home: string; links: { href: string; label: string }[] };

const SECTIONS: Section[] = [
  {
    title: "Study Hub",
    home: "/study",
    links: [
      { href: "/study", label: "Огляд" },
      { href: "/study/schedule", label: "Розклад" },
      { href: "/study/tasks", label: "Завдання" },
      { href: "/study/subjects", label: "Предмети" },
      { href: "/study/grades", label: "Оцінки" },
      { href: "/study/semesters", label: "Семестри" },
    ],
  },
  {
    title: "Вішліст",
    home: "/wishlist",
    links: [{ href: "/wishlist", label: "Мої бажання" }],
  },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/w/") || pathname.startsWith("/s/")) return null;

  const section = SECTIONS.find((s) => pathname === s.home || pathname.startsWith(s.home + "/"));
  // Посилання розділу активне на своїй сторінці й підсторінках; «головна» розділу — лише на собі.
  const isActive = (href: string) => (href === section?.home ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-surface md:fixed md:inset-y-0 md:left-0 md:w-52 md:border-b-0 md:border-r">
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 md:flex-col md:items-stretch md:gap-0.5 md:px-3 md:py-5">
        {section ? (
          <>
            <Link href="/" className="shrink-0 rounded-md px-2 py-1.5 text-sm text-muted hover:text-text md:mb-1">
              ← <span className="md:inline">Усі розділи</span>
            </Link>
            <Link href={section.home} className="hidden shrink-0 px-2 py-1.5 font-semibold md:mb-4 md:block">
              {section.title}
            </Link>
            {section.links.map((link) => (
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
          </>
        ) : (
          <>
            <span className="shrink-0 px-2 py-1.5 font-semibold md:mb-4">Мій простір</span>
            {SECTIONS.map((s) => (
              <Link key={s.home} href={s.home} className="shrink-0 rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-surface-muted hover:text-text">
                {s.title}
              </Link>
            ))}
          </>
        )}
        <form action={logout} className="ml-auto shrink-0 md:ml-0 md:mt-auto">
          <button className="rounded-md px-2.5 py-1.5 text-sm text-muted hover:text-text md:mt-6">Вийти</button>
        </form>
      </div>
    </nav>
  );
}
