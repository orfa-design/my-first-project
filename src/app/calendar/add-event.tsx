"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { WEEKDAY_OPTIONS } from "@/lib/calendar";
import type { FormState } from "@/lib/form";
import { addEventAction } from "./actions";
import { shrinkInputFile } from "./shrink-image";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Кнопка «+ Подія» і форма, що виїжджає знизу екрана. */
export function AddEvent({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState<"mine" | "other">("mine");
  const [repeats, setRepeats] = useState(false);
  const [posterName, setPosterName] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(addEventAction, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (pending) {
      submitted.current = true;
      return;
    }
    if (submitted.current && !state.error) {
      submitted.current = false;
      setOpen(false);
      setOwner("mine");
      setRepeats(false);
      setPosterName("");
    }
  }, [pending, state]);

  if (!open)
    return (
      <button type="button" className="cal-fab" onClick={() => setOpen(true)}>
        + Подія
      </button>
    );

  return (
    <div className="cal-sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <form action={action} className="cal-sheet">
        <div className="cal-sheet-head">
          <h2>Нова подія</h2>
          <button type="button" className="cal-x" onClick={() => setOpen(false)} aria-label="Закрити">
            ×
          </button>
        </div>

        <div className="cal-seg" role="radiogroup">
          {(["mine", "other"] as const).map((o) => (
            <label key={o} className={owner === o ? "on" : ""}>
              <input type="radio" name="owner" value={o} checked={owner === o} onChange={() => setOwner(o)} />
              {o === "mine" ? "Моя" : "Іншої людини"}
            </label>
          ))}
        </div>

        {owner === "other" && (
          <label className="cal-field">
            <span>Чия</span>
            <input name="person" required placeholder="Ім'я" autoComplete="off" />
          </label>
        )}
        <label className="cal-field">
          <span>Що</span>
          <input name="title" required placeholder="Танці, кіно, лікар…" autoComplete="off" />
        </label>
        <div className="cal-row">
          <label className="cal-field">
            <span>{repeats ? "Починаючи з" : "Дата"}</span>
            <input name="date" type="date" required defaultValue={today} />
          </label>
          {/* Два списки замість поля часу: воно на телефоні з англійським регіоном показує AM/PM. */}
          <div className="cal-field">
            <span>Час</span>
            <div className="cal-time">
              <select name="hour" aria-label="Година" defaultValue="">
                <option value="">—</option>
                {HOURS.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
              <b>:</b>
              <select name="minute" aria-label="Хвилини" defaultValue="00">
                {MINUTES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <p className="cal-hint">Без часу — подія на весь день.</p>

        <label className="cal-check">
          <input type="checkbox" name="repeats" checked={repeats} onChange={(e) => setRepeats(e.target.checked)} />
          Повторюється щотижня
        </label>
        {repeats && (
          <>
            <div className="cal-days">
              {WEEKDAY_OPTIONS.map((d) => (
                <label key={d.value}>
                  <input type="checkbox" name="weekdays" value={d.value} />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
            <label className="cal-field">
              <span>До якої дати (порожньо — безстроково)</span>
              <input name="repeat_until" type="date" />
            </label>
          </>
        )}

        <label className="cal-field">
          <span>Місце</span>
          <input name="place" autoComplete="off" />
        </label>
        <label className="cal-field">
          <span>Нотатка</span>
          <textarea name="note" rows={2} />
        </label>
        <div className="cal-field">
          <span>Афіша чи картинка</span>
          <label className="cal-file">
            <input
              name="poster"
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const input = e.currentTarget;
                await shrinkInputFile(input);
                setPosterName(input.files?.[0]?.name ?? "");
              }}
            />
            {posterName ? `🖼 ${posterName}` : "Обрати фото"}
          </label>
        </div>

        {state.error && <p className="cal-error">{state.error}</p>}
        <button className="cal-btn" disabled={pending}>
          {pending ? "Додаю…" : "Додати"}
        </button>
      </form>
    </div>
  );
}
