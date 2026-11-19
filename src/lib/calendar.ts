import { addDays, mondayOf } from "./dates";
import type { CalEvent } from "./types";

// Розкладка подій календаря по розділах: Сьогодні / Завтра / Цей тиждень (до неділі) / Пізніше / Минулі.

export type Occurrence = { event: CalEvent; date: string };
export type AgendaDay = { date: string; items: Occurrence[] };
export type Agenda = {
  today: AgendaDay;
  tomorrow: AgendaDay;
  /** Від післязавтра до неділі включно. */
  week: AgendaDay[];
  /** Усе далі; регулярні — лише найближчий повтор у кожен із їхніх днів тижня. */
  later: AgendaDay[];
  /** Минулі разові події, новіші вище. */
  past: AgendaDay[];
};

/** День тижня: 1 — пн … 7 — нд. */
export function isoWeekday(date: string): number {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/** Чи відбувається подія в цей день (з урахуванням повторів і пропусків). */
function occursOn(e: CalEvent, date: string): boolean {
  if (!e.weekdays) return e.date === date;
  return (
    date >= e.date &&
    (!e.repeat_until || date <= e.repeat_until) &&
    e.weekdays.includes(isoWeekday(date)) &&
    !e.skipped_dates.includes(date)
  );
}

function between(events: CalEvent[], from: string, to: string): Occurrence[] {
  const out: Occurrence[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) for (const e of events) if (occursOn(e, d)) out.push({ event: e, date: d });
  return out;
}

/** Події дня: спершу на весь день, далі за часом. */
const byTime = (a: Occurrence, b: Occurrence) =>
  a.date.localeCompare(b.date) || (a.event.time ?? "").localeCompare(b.event.time ?? "") || a.event.title.localeCompare(b.event.title);

function groupByDay(items: Occurrence[], newestFirst = false): AgendaDay[] {
  const days = new Map<string, Occurrence[]>();
  for (const o of [...items].sort(byTime)) days.set(o.date, [...(days.get(o.date) ?? []), o]);
  const list = [...days].map(([date, items]) => ({ date, items }));
  return newestFirst ? list.reverse() : list;
}

export function buildAgenda(events: CalEvent[], today: string): Agenda {
  const tomorrow = addDays(today, 1);
  const sunday = addDays(mondayOf(today), 6);
  const weekFrom = addDays(today, 2);
  const laterFrom = weekFrom > sunday ? weekFrom : addDays(sunday, 1);

  const later: Occurrence[] = [];
  for (const e of events) {
    if (!e.weekdays) {
      if (e.date >= laterFrom) later.push({ event: e, date: e.date });
      continue;
    }
    // Регулярна подія: у «Пізніше» — по одному найближчому повтору в кожен її день тижня.
    for (const wd of e.weekdays) {
      let d = laterFrom > e.date ? laterFrom : e.date;
      for (let i = 0; i < 400 && (!e.repeat_until || d <= e.repeat_until); i++, d = addDays(d, 1)) {
        if (isoWeekday(d) === wd && occursOn(e, d)) {
          later.push({ event: e, date: d });
          break;
        }
      }
    }
  }

  return {
    today: { date: today, items: between(events, today, today).sort(byTime) },
    tomorrow: { date: tomorrow, items: between(events, tomorrow, tomorrow).sort(byTime) },
    week: weekFrom <= sunday ? groupByDay(between(events, weekFrom, sunday)) : [],
    later: groupByDay(later),
    past: groupByDay(
      events.filter((e) => !e.weekdays && e.date < today).map((e) => ({ event: e, date: e.date })),
      true,
    ),
  };
}

const WEEKDAY_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];
const WEEKDAY_EVERY = ["щопонеділка", "щовівторка", "щосереди", "щочетверга", "щоп'ятниці", "щосуботи", "щонеділі"];

export const weekdayShort = (date: string) => WEEKDAY_SHORT[isoWeekday(date) - 1];
export const WEEKDAY_OPTIONS = WEEKDAY_SHORT.map((label, i) => ({ value: i + 1, label }));

/** «щопонеділка й щоп'ятниці» */
export function repeatLabel(weekdays: number[]): string {
  const parts = weekdays.map((d) => WEEKDAY_EVERY[d - 1]);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} й ${parts.at(-1)}` : parts[0];
}

const dayMonth = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", timeZone: "UTC" });
/** «21 листопада» */
export const dayMonthLabel = (date: string) => dayMonth.format(new Date(`${date}T00:00:00Z`));
