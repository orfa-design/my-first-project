import postgres from "postgres";

// Одне з'єднання на процес. У dev-режимі модулі перезавантажуються,
// тому тримаємо клієнт у globalThis, щоб не плодити підключення.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

function createClient() {
  // Прибираємо пробіли й лапки, які часто потрапляють у значення при копіюванні.
  const url = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, "");
  if (!url) {
    throw new Error("DATABASE_URL не задано. Див. README → «Налаштування».");
  }
  return postgres(url, {
    // Пулер Supabase (transaction mode) не підтримує prepared statements.
    prepare: false,
    max: 5,
    // На Vercel функція «засинає» між запитами, і з'єднання, відкриті до сну, можуть бути
    // вже розірвані пулером — запит на такому з'єднанні висить до тайм-ауту функції.
    // Тому не тримаємо простійні з'єднання довго і не чекаємо підключення безкінечно.
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
    // Дати (date) повертаємо як рядки YYYY-MM-DD, без зсуву часових поясів.
    types: {
      date: {
        to: 1082,
        from: [1082],
        serialize: (x: string) => x,
        parse: (x: string) => x,
      },
    },
  });
}

export function db(): postgres.Sql {
  globalForDb.sql ??= createClient();
  return globalForDb.sql;
}
