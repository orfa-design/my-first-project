import postgres from "postgres";

// Одне з'єднання на процес. У dev-режимі модулі перезавантажуються,
// тому тримаємо клієнт у globalThis, щоб не плодити підключення.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL не задано. Див. README → «Налаштування».");
  }
  return postgres(url, {
    // Пулер Supabase (transaction mode) не підтримує prepared statements.
    prepare: false,
    max: 5,
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
