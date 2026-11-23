"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { WEEKDAY_OPTIONS } from "@/lib/calendar";
import type { FormState } from "@/lib/form";
import type { CalEvent } from "@/lib/types";
import { saveEventAction } from "./actions";
import { shrinkInputFile } from "./shrink-image";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Кнопка «+ Подія» і форма, що виїжджає знизу екрана. */
export function AddEvent({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="cal-fab" onClick={() => setOpen(true)}>
        + Подія
      </button>
      {open && <EventSheet today={today} onClose={() => setOpen(false)} />}
    </>
  );
}

/** «Редагувати» в розгорнутій події — та сама форма, заповнена. */
export function EditEvent({ event, today }: { event: CalEvent; today: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="cal-link" onClick={() => setOpen(true)}>
        Редагувати
      </button>
      {open && <EventSheet today={today} event={event} onClose={() => setOpen(false)} />}
    </>
  );
}

function EventSheet({ today, event, onClose }: { today: string; event?: CalEvent; onClose: () => void }) {
  const [owner, setOwner] = useState<"mine" | "other">(event?.owner ?? "mine");
  const [repeats, setRepeats] = useState(Boolean(event?.weekdays));
  const [posterName, setPosterName] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(saveEventAction.bind(null, event?.id ?? null), {});
  const submitted = useRef(false);

  useEffect(() => {
    if (pending) {
      submitted.current = true;
      return;
    }
    if (submitted.current && !state.error) {
      submitted.current = false;
      onClose();
    }
  }, [pending, state, onClose]);

  const [hour, minute] = event?.time ? event.time.split(":") : ["", "00"];
  // Хвилини, задані через чат, можуть бути не кратні 5 — тоді додаємо їх у список.
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  return (
    <div className="cal-sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form action={action} className="cal-sheet">
        <div className="cal-sheet-head">
          <h2>{event ? "Редагувати подію" : "Нова подія"}</h2>
          <button type="button" className="cal-x" onClick={onClose} aria-label="Закрити">
            ×
          </button>
        </div>
        {event?.weekdays && <p className="cal-hint cal-hint-top">Зміни застосуються до всіх повторень.</p>}

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
            <input name="person" required placeholder="Ім'я" autoComplete="off" defaultValue={event?.person ?? ""} />
          </label>
        )}
        <label className="cal-field">
          <span>Що</span>
          <input name="title" required placeholder="Танці, кіно, лікар…" autoComplete="off" defaultValue={event?.title} />
        </label>
        <div className="cal-row">
          <label className="cal-field">
            <span>{repeats ? "Починаючи з" : "Дата"}</span>
            <input name="date" type="date" required defaultValue={event?.date ?? today} />
          </label>
          {/* Два списки замість поля часу: воно на телефоні з англійським регіоном показує AM/PM. */}
          <div className="cal-field">
            <span>Час</span>
            <div className="cal-time">
              <select name="hour" aria-label="Година" defaultValue={hour}>
                <option value="">—</option>
                {HOURS.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
              <b>:</b>
              <select name="minute" aria-label="Хвилини" defaultValue={minute}>
                {minutes.map((m) => (
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
                  <input type="checkbox" name="weekdays" value={d.value} defaultChecked={event?.weekdays?.includes(d.value)} />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
            <label className="cal-field">
              <span>До якої дати (порожньо — безстроково)</span>
              <input name="repeat_until" type="date" defaultValue={event?.repeat_until ?? ""} />
            </label>
          </>
        )}

        <label className="cal-field">
          <span>Місце</span>
          <input name="place" autoComplete="off" defaultValue={event?.place ?? ""} />
        </label>
        <label className="cal-field">
          <span>Посилання (квитки, сторінка події)</span>
          <input name="url" type="url" inputMode="url" placeholder="https://…" autoComplete="off" defaultValue={event?.url ?? ""} />
        </label>
        <label className="cal-field">
          <span>Нотатка</span>
          <textarea name="note" rows={2} defaultValue={event?.note ?? ""} />
        </label>
        <div className="cal-field">
          <span>Зображення</span>
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
            {posterName ? `🖼 ${posterName}` : event?.has_poster ? "Замінити зображення" : "Обрати фото"}
          </label>
        </div>

        {state.error && <p className="cal-error">{state.error}</p>}
        <button className="cal-btn" disabled={pending}>
          {pending ? "Зберігаю…" : event ? "Зберегти" : "Додати"}
        </button>
      </form>
    </div>
  );
}
