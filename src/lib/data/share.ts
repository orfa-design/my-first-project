import { randomBytes } from "node:crypto";
import { db } from "../db";

// Публічні посилання Study Hub (поки одне — на розклад): /s/<token>, без пароля, лише перегляд.

export type ShareKind = "schedule";

export async function getShareToken(kind: ShareKind): Promise<string | null> {
  const [row] = await db()<{ token: string }[]>`select token from sh_share_links where kind = ${kind}`;
  return row?.token ?? null;
}

/** Чи відкриває цей ключ публічний розклад. */
export async function isScheduleToken(token: string): Promise<boolean> {
  if (!/^[a-z0-9]{8,64}$/.test(token)) return false;
  const [row] = await db()`select 1 from sh_share_links where kind = 'schedule' and token = ${token}`;
  return Boolean(row);
}

/** Новий ключ посилання: старе посилання перестає працювати. */
export async function regenerateShareToken(kind: ShareKind): Promise<string> {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const token = [...randomBytes(16)].map((b) => alphabet[b % alphabet.length]).join("");
  await db()`
    insert into sh_share_links (kind, token) values (${kind}, ${token})
    on conflict (kind) do update set token = excluded.token`;
  return token;
}
