"use client";

import { useState } from "react";
import type { CalTodo } from "@/lib/types";
import { deleteTodoAction, toggleTodoAction, updateTodoAction } from "./actions";

/** Справа: торкнутися — відмітити; «⋯» — змінити текст або видалити. */
export function TodoItem({ todo }: { todo: CalTodo }) {
  const [editing, setEditing] = useState(false);
  const done = Boolean(todo.done_at);

  if (editing)
    return (
      <li className="cal-todo-edit">
        <form
          action={async (formData) => {
            await updateTodoAction(todo.id, formData);
            setEditing(false);
          }}
        >
          <input name="title" defaultValue={todo.title} required autoFocus aria-label="Текст справи" />
          <div className="cal-actions">
            <button className="cal-link">Зберегти</button>
            <button
              type="button"
              className="cal-link danger"
              onClick={async () => {
                if (confirm(`Видалити «${todo.title}»?`)) await deleteTodoAction(todo.id);
              }}
            >
              Видалити
            </button>
            <button type="button" className="cal-link muted" onClick={() => setEditing(false)}>
              Скасувати
            </button>
          </div>
        </form>
      </li>
    );

  return (
    <li className={done ? "done" : ""}>
      <form action={toggleTodoAction.bind(null, todo.id, !done)} className="cal-todo-row">
        <button className="cal-todo" aria-pressed={done}>
          <span className="cal-box">{done ? "✓" : ""}</span>
          <span>{todo.title}</span>
        </button>
        <button type="button" className="cal-more-btn" onClick={() => setEditing(true)} aria-label="Змінити або видалити">
          ⋯
        </button>
      </form>
    </li>
  );
}
