"use client";

import type { ReactNode } from "react";

/** Кнопка, що перепитує перед відправкою форми (для видалення). */
export function ConfirmButton({ message, children, className }: { message: string; children: ReactNode; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
