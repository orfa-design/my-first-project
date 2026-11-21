"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Згортуваний розділ («Пізніше», «Минулі події»), що пам'ятає, згорнутий він чи розгорнутий:
 * стан зберігається в браузері (localStorage) і повертається після оновлення сторінки.
 */
export function Fold({ id, summary, children }: { id: string; summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const key = `cal-fold:${id}`;

  useEffect(() => {
    try {
      if (localStorage.getItem(key) === "open" && ref.current) ref.current.open = true;
    } catch {
      // Приватний режим чи заблоковане сховище — просто згорнуто.
    }
  }, [key]);

  return (
    <details
      ref={ref}
      className="cal-sec cal-fold"
      onToggle={(e) => {
        try {
          localStorage.setItem(key, e.currentTarget.open ? "open" : "closed");
        } catch {
          // Не вдалося запам'ятати — не страшно.
        }
      }}
    >
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
