"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/lib/form";
import { PRIORITIES } from "@/lib/schemas";
import type { WishItem } from "@/lib/types";
import { Field } from "./form-shell";

/** Як пріоритет бачить той, хто вибирає подарунок. */
const WISH_PRIORITY_LABELS = { low: "Запасний варіант", normal: "Звичайне", high: "Дуже хочу" } as const;

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Форма бажання. Без item — нове бажання (після додавання очищується);
 * з item — редагування наявного (після збереження викликає onDone).
 */
export function WishForm({ action, item, onDone }: { action: Action; item?: WishItem; onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
  useEffect(() => {
    if (pending) {
      submitted.current = true;
      return;
    }
    if (!submitted.current || state.error) return;
    submitted.current = false;
    if (item) onDone?.();
    else formRef.current?.reset();
  }, [pending, state, item, onDone]);

  return (
    <form ref={formRef} action={formAction} className={`space-y-4 ${item ? "" : "card p-4"}`}>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Що хочу">
          <input name="title" required defaultValue={item?.title} className="input" placeholder="Наприклад: книжка «…», шарф, сертифікат" />
        </Field>
        <Field label="Орієнтовна ціна">
          <input name="price" defaultValue={item?.price ?? ""} className="input" placeholder="≈ 800 грн" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Посилання на магазин">
          <input name="url" type="url" defaultValue={item?.url ?? ""} className="input" placeholder="https://…" />
        </Field>
        <Field label="Картинка (необов'язково)">
          <input name="image_url" type="url" defaultValue={item?.image_url ?? ""} className="input" placeholder="порожньо — знайду з посилання" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Коментар">
          <textarea name="note" rows={2} defaultValue={item?.note ?? ""} className="input" placeholder="розмір M, будь-який колір…" />
        </Field>
        <Field label="Наскільки хочу">
          <select name="priority" defaultValue={item?.priority ?? ""} className="input">
            <option value="">—</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{WISH_PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </Field>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={pending}>
          {item ? (pending ? "Зберігаю…" : "Зберегти") : pending ? "Додаю…" : "Додати бажання"}
        </button>
        {item && (
          <button type="button" className="btn-secondary" onClick={onDone}>
            Скасувати
          </button>
        )}
      </div>
    </form>
  );
}

/** Кнопка «Редагувати» з формою, що розгортається на місці. */
export function WishEditor({ item, action }: { item: WishItem; action: Action }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setOpen(true)}>
        Редагувати
      </button>
    );
  return (
    <div className="w-full rounded-lg border border-border p-3">
      <WishForm action={action} item={item} onDone={() => setOpen(false)} />
    </div>
  );
}
