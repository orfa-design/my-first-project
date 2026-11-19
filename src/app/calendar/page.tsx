import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { Prose } from "@/components/ui";
import { buildAgenda, dayMonthLabel, repeatLabel, weekdayShort, type AgendaDay, type Occurrence } from "@/lib/calendar";
import { listEvents, listTodos } from "@/lib/data/calendar";
import { todayKyiv } from "@/lib/dates";
import type { CalTodo } from "@/lib/types";
import {
  addTodoAction,
  deleteEventAction,
  removePosterAction,
  skipOccurrenceAction,
} from "./actions";
import { AddEvent, EditEvent } from "./add-event";
import { TodoItem } from "./todo-item";
import { calText, calTitle } from "./fonts";
import { PosterUpload } from "./poster-upload";
import "./calendar.css";

// Особистий календар: найближче — з першого погляду. Список по днях, а не сітка тижня.
// Сторінка накриває загальний макет сайту (як публічні сторінки), бо має власне оформлення «Папір».

export const metadata: Metadata = { title: "Календар" };

const longDate = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default function CalendarPage() {
  return (
    <div className={`cal ${calTitle.variable} ${calText.variable}`}>
      <main className="cal-wrap">
        <Suspense fallback={<p className="cal-muted">Завантажую…</p>}>
          <Calendar />
        </Suspense>
      </main>
    </div>
  );
}

async function Calendar() {
  await connection();
  const today = todayKyiv();
  const [events, todos] = await Promise.all([listEvents(), listTodos(today)]);
  const agenda = buildAgenda(events, today);
  const laterCount = agenda.later.reduce((n, d) => n + d.items.length, 0);
  const pastCount = agenda.past.reduce((n, d) => n + d.items.length, 0);

  return (
    <>
      <header className="cal-head">
        <Link href="/" className="cal-back">← Усі розділи</Link>
        <div className="cal-kicker">{longDate.format(new Date(`${today}T00:00:00Z`))}</div>
        <h1>Мій календар</h1>
      </header>

      <section className="cal-sec">
        <h2>Сьогодні</h2>
        <Day day={agenda.today} today={today} emptyText="Вільний день ✨" />
      </section>

      <Todos todos={todos} />

      <section className="cal-sec">
        <h2>Завтра</h2>
        <Day day={agenda.tomorrow} today={today} emptyText="Поки нічого не заплановано" />
      </section>

      {agenda.week.length > 0 && (
        <section className="cal-sec">
          <h2>Цей тиждень</h2>
          {agenda.week.map((d) => (
            <Day key={d.date} day={d} today={today} />
          ))}
        </section>
      )}

      <details className="cal-sec cal-fold">
        <summary>
          <h2>
            Пізніше <small>· {laterCount ? `${laterCount} ${plural(laterCount)}` : "порожньо"}</small>
          </h2>
        </summary>
        {agenda.later.length ? (
          agenda.later.map((d) => <Day key={d.date} day={d} today={today} />)
        ) : (
          <p className="cal-muted">Далі поки нічого немає.</p>
        )}
        {agenda.later.some((d) => d.items.some((o) => o.event.weekdays)) && (
          <p className="cal-muted cal-small">Регулярні події тут — лише найближчий повтор.</p>
        )}
      </details>

      <details className="cal-sec cal-fold">
        <summary>
          <h2>
            Минулі події <small>· {pastCount}</small>
          </h2>
        </summary>
        {agenda.past.length ? (
          agenda.past.map((d) => <Day key={d.date} day={d} today={today} past />)
        ) : (
          <p className="cal-muted">Минулих подій ще немає.</p>
        )}
      </details>

      <AddEvent today={today} />
    </>
  );
}

function plural(n: number): string {
  const few = n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14);
  return n % 10 === 1 && n % 100 !== 11 ? "подія" : few ? "події" : "подій";
}

function Day({ day, today, emptyText, past = false }: { day: AgendaDay; today: string; emptyText?: string; past?: boolean }) {
  return (
    <div className={`cal-day ${past ? "past" : ""}`}>
      <div className="cal-dh">
        <span className="cal-dow">{weekdayShort(day.date)}</span>
        <span className="cal-date">{dayMonthLabel(day.date)}</span>
      </div>
      {day.items.length ? (
        <ul>
          {day.items.map((o) => (
            <EventRow key={`${o.event.id}-${o.date}`} o={o} today={today} />
          ))}
        </ul>
      ) : (
        <p className="cal-free">{emptyText}</p>
      )}
    </div>
  );
}

/** Подія: рядок «час — назва»; натиснути — розгорнуться місце, нотатка, афіша й дії. */
function EventRow({ o, today }: { o: Occurrence; today: string }) {
  const e = o.event;
  const extras = [e.place && "📍", e.note && "💬", e.has_poster && "🖼"].filter(Boolean).join(" ");
  return (
    <li className={`cal-ev ${e.owner}`}>
      <details>
        <summary>
          <span className={`cal-t ${e.time ? "" : "allday"}`}>{e.time ? e.time.slice(0, 5) : "весь день"}</span>
          <span className="cal-name">
            {e.person && <span className="cal-who">{e.person}</span>}
            {e.title}
            {e.weekdays && <span className="cal-rep" title="Повторюється">↻</span>}
          </span>
          {extras && <span className="cal-extras">{extras}</span>}
        </summary>
        <div className="cal-more">
          {e.weekdays && (
            <p className="cal-muted">
              ↻ {repeatLabel(e.weekdays)}
              {e.repeat_until ? `, до ${dayMonthLabel(e.repeat_until)}` : ""}
            </p>
          )}
          {e.place && <p>📍 {e.place}</p>}
          {e.note && <Prose>{e.note}</Prose>}
          {e.has_poster && (
            <a href={`/calendar/poster/${e.id}?v=${e.poster_version}`} target="_blank" rel="noreferrer">
              {/* Картинка з бази, а не з зовнішнього сайту. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cal-poster" src={`/calendar/poster/${e.id}?v=${e.poster_version}`} alt={`Афіша: ${e.title}`} loading="lazy" />
            </a>
          )}
          <div className="cal-actions">
            {e.weekdays && o.date >= today && (
              <form action={skipOccurrenceAction.bind(null, e.id, o.date)}>
                <button className="cal-link">Пропустити {dayMonthLabel(o.date)}</button>
              </form>
            )}
            <EditEvent event={e} today={today} />
            <PosterUpload eventId={e.id} label={e.has_poster ? "Замінити афішу" : "Додати афішу"} />
            {e.has_poster && (
              <form action={removePosterAction.bind(null, e.id)}>
                <button className="cal-link">Прибрати афішу</button>
              </form>
            )}
            <form action={deleteEventAction.bind(null, e.id)}>
              <ConfirmButton
                className="cal-link danger"
                message={e.weekdays ? `Видалити «${e.title}» разом з усіма повтореннями?` : `Видалити «${e.title}»?`}
              >
                {e.weekdays ? "Видалити всі повторення" : "Видалити"}
              </ConfirmButton>
            </form>
          </div>
        </div>
      </details>
    </li>
  );
}

function Todos({ todos }: { todos: CalTodo[] }) {
  return (
    <section className="cal-sec cal-todos">
      <h2>Справи</h2>
      {todos.length > 0 && (
        <ul>
          {todos.map((t) => (
            <TodoItem key={t.id} todo={t} />
          ))}
        </ul>
      )}
      <form action={addTodoAction} className="cal-todo-add">
        <input name="title" placeholder="+ додати справу" aria-label="Нова справа" autoComplete="off" required />
        <button className="cal-link">Додати</button>
      </form>
    </section>
  );
}
