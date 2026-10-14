import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Study Hub", template: "%s · Study Hub" },
  description: "Особистий простір для навчання: предмети, завдання, дедлайни",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <Suspense fallback={<div className="h-14 border-b border-border bg-surface md:hidden" />}>
          <Nav />
        </Suspense>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 md:pl-60 md:pr-8 md:py-8">{children}</main>
      </body>
    </html>
  );
}
