import { connection } from "next/server";
import { db } from "@/lib/db";

// Діагностика підключення до бази. Пароль не показується — лише його ознаки.
// Доступно тільки після входу (маршрут закритий proxy).

function describe(raw: string | undefined) {
  if (!raw) return { set: false };
  const issues: string[] = [];
  if (raw !== raw.trim()) issues.push("пробіли або перенос рядка на початку чи в кінці");
  if (/^["']|["']$/.test(raw.trim())) issues.push("лапки навколо значення");
  if (raw.includes("[YOUR-PASSWORD]") || raw.includes("[") || raw.includes("]")) issues.push("квадратні дужки або заглушка [YOUR-PASSWORD]");

  let url: URL;
  try {
    url = new URL(raw.trim().replace(/^["']|["']$/g, ""));
  } catch {
    return { set: true, parsed: false, issues: [...issues, "рядок не розбирається як адреса"] };
  }

  let password = "";
  try {
    password = decodeURIComponent(url.password);
  } catch {
    issues.push("пароль містить некоректне %-кодування");
  }
  if (/[^A-Za-z0-9]/.test(password)) issues.push("пароль містить спецсимволи — краще згенерувати пароль лише з літер і цифр");
  if (!url.username.includes(".")) issues.push("ім'я користувача без коду проєкту (очікується postgres.<код>)");
  if (url.port !== "6543") issues.push(`порт ${url.port || "не вказано"}, очікується 6543 (Transaction pooler)`);

  return {
    set: true,
    parsed: true,
    protocol: url.protocol,
    user: decodeURIComponent(url.username),
    host: url.hostname,
    port: url.port,
    database: url.pathname.slice(1),
    passwordLength: password.length,
    issues,
  };
}

export async function GET() {
  await connection();
  const config = describe(process.env.DATABASE_URL);
  let database: { ok: boolean; error?: string; code?: string; tables?: string[] };
  try {
    const rows = await db()<{ table_name: string }[]>`
      select table_name from information_schema.tables where table_name like 'sh_%' order by 1`;
    database = { ok: true, tables: rows.map((r) => r.table_name) };
  } catch (err) {
    const e = err as { message?: string; code?: string };
    database = { ok: false, error: e.message, code: e.code };
  }
  return Response.json({ config, database });
}
