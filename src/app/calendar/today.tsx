"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";

// Жива частина «Сьогодні»: лінія «зараз», що минуло / триває, і підказка «Далі: …».
// Час — київський; оновлюється раз на хвилину без перезавантаження сторінки.

/** Скільки після початку подія ще вважається «триває» (запас на запізнення), хв. */
const GRACE_MIN = 60;

const kyivClock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const kyivDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" });

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Поточний київський час «ГГ:ХХ» (null до першого рендеру в браузері — щоб не було розбіжності з сервером). */
function useKyivNow(today: string): string | null {
  const router = useRouter();
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const date = new Date();
      // Минула північ — сторінка вже про вчора: перезавантажуємо дані.
      if (kyivDate.format(date) !== today) router.refresh();
      setNow(kyivClock.format(date));
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [today, router]);
  return now;
}

export type TodayItem = { key: string; time: string | null; title: string; node: ReactNode };

type State = "allday" | "past" | "live" | "future";

function stateOf(time: string | null, now: number): State {
  if (!time) return "allday";
  const start = toMin(time);
  if (now < start) return "future";
  return now < start + GRACE_MIN ? "live" : "past";
}

/** Події сьогодні з лінією «зараз» між минулим і майбутнім. */
export function TodayList({ today, items }: { today: string; items: TodayItem[] }) {
  const now = useKyivNow(today);
  const nowMin = now ? toMin(now) : null;
  const states = items.map((i) => (nowMin === null ? "future" : stateOf(i.time, nowMin)));
  // Лінія стоїть перед першою майбутньою подією (або в кінці, якщо все вже почалося).
  const lineAt = nowMin === null ? -1 : (() => {
    const i = states.findIndex((s) => s === "future");
    return i === -1 ? items.length : i;
  })();

  const line = (
    <li className="cal-now" aria-label={`Зараз ${now}`}>
      <span>зараз {now}</span>
    </li>
  );
  return (
    <ul>
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {i === lineAt && line}
          <li className={`cal-slot ${states[i]}`}>
            {item.node}
            {states[i] === "live" && <span className="cal-live">триває</span>}
          </li>
        </Fragment>
      ))}
      {lineAt === items.length && line}
    </ul>
  );
}

function inWords(min: number): string {
  if (min < 60) return `через ${min} хв`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `через ${h} год ${m} хв` : `через ${h} год`;
}

/** «Далі: Майстер-клас о 16:00 · через 1 год 20 хв» — під заголовком. */
export function NextUp({ today, items }: { today: string; items: { time: string; title: string }[] }) {
  const now = useKyivNow(today);
  if (!now) return null;
  const nowMin = toMin(now);
  const next = items.find((i) => toMin(i.time) > nowMin);
  if (!next) return null;
  return (
    <p className="cal-next">
      Далі: <b>{next.title}</b> о {next.time} · {inWords(toMin(next.time) - nowMin)}
    </p>
  );
}
