"use client";

import { useEffect, useState, type ReactNode } from "react";

type Theme = "xmas" | "gift";
const STORAGE_KEY = "wishlist-theme";

/**
 * Оболонка публічного вішліста з перемикачем оформлення. За замовчуванням — новорічне;
 * вибір запам'ятовується в браузері того, хто дивиться.
 */
export function ThemedWishlist({
  title,
  intro,
  fontClasses,
  children,
}: {
  title: string;
  intro: ReactNode;
  fontClasses: string;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("xmas");

  useEffect(() => {
    try {
      // Відновлюємо збережений вибір після першого відмальовування — так немає розбіжності з сервером.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(STORAGE_KEY) === "gift") setTheme("gift");
    } catch {
      // localStorage може бути недоступний (приватний режим) — лишаємо новорічне.
    }
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // див. вище
    }
  };

  return (
    <div className={`wl ${fontClasses}`} data-theme={theme}>
      <div className="wl-snow" aria-hidden />
      <div className="wl-wrap">
        <header className="wl-head">
          <h1 className="wl-title">{title}</h1>
          <div className="wl-toggle" role="group" aria-label="Оформлення">
            <button type="button" aria-pressed={theme === "xmas"} onClick={() => choose("xmas")}>🎄 Новорічний</button>
            <button type="button" aria-pressed={theme === "gift"} onClick={() => choose("gift")}>🎁 Подарунковий</button>
          </div>
        </header>
        {intro}
        {children}
        <footer className="wl-foot" />
      </div>
    </div>
  );
}
