"use client";

import { useRef, useTransition } from "react";
import { addTodoAction } from "./actions";

/**
 * Нова справа. Поки зберігається — поле й кнопка заблоковані, а поле одразу очищається:
 * повторні натискання «Додати» не створюють копій.
 */
export function TodoAdd() {
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  return (
    <form
      className="cal-todo-add"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy.current) return;
        const form = e.currentTarget;
        const formData = new FormData(form);
        if (!String(formData.get("title") ?? "").trim()) return;
        busy.current = true;
        form.reset();
        startTransition(async () => {
          try {
            await addTodoAction(formData);
          } finally {
            busy.current = false;
          }
        });
      }}
    >
      <input name="title" placeholder="+ додати справу" aria-label="Нова справа" autoComplete="off" required readOnly={pending} />
      <button className="cal-link" disabled={pending}>
        {pending ? "Додаю…" : "Додати"}
      </button>
    </form>
  );
}
