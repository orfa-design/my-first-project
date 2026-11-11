"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/lib/form";
import { PRIORITIES } from "@/lib/schemas";
import { Field } from "./form-shell";

/** Як пріоритет бачить той, хто вибирає подарунок. */
const WISH_PRIORITY_LABELS = { low: "Запасний варіант", normal: "Звичайне", high: "Дуже хочу" } as const;

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Форма нового бажання; після успішного додавання очищується. */
export function WishForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="card space-y-4 p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Що хочу">
          <input name="title" required className="input" placeholder="Наприклад: книжка «…», шарф, сертифікат" />
        </Field>
        <Field label="Орієнтовна ціна">
          <input name="price" className="input" placeholder="≈ 800 грн" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Посилання на магазин">
          <input name="url" type="url" className="input" placeholder="https://…" />
        </Field>
        <Field label="Картинка (необов'язково)">
          <input name="image_url" type="url" className="input" placeholder="порожньо — знайду з посилання" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Коментар">
          <input name="note" className="input" placeholder="розмір M, будь-який колір…" />
        </Field>
        <Field label="Наскільки хочу">
          <select name="priority" defaultValue="" className="input">
            <option value="">—</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{WISH_PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </Field>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Додаю…" : "Додати бажання"}</button>
    </form>
  );
}
