import type { Metadata } from "next";

// Публічний розклад Study Hub: за секретним ключем у посиланні, без пароля (proxy пропускає /s/),
// лише перегляд — без оцінок, нотаток і джерел. Сторінка накриває загальний макет сайту з меню.

export const metadata: Metadata = { title: { default: "Розклад", template: "%s · Розклад" }, robots: { index: false, follow: false } };

export default function PublicScheduleLayout({ children }: LayoutProps<"/s/[token]">) {
  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-bg">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">{children}</div>
    </div>
  );
}
