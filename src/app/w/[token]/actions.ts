"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getListByToken, releaseItem, reserveItem } from "@/lib/data/wishlist";

// Дії публічної сторінки вішліста: без пароля, але лише в межах списку з цим ключем.
// Того, хто бронює, впізнаємо за випадковим ідентифікатором у cookie браузера.

const VISITOR_COOKIE = "wl_visitor";

async function visitorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
  const id = randomBytes(16).toString("hex");
  jar.set(VISITOR_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: true, path: "/w", maxAge: 60 * 60 * 24 * 365 });
  return id;
}

export async function reserveWishAction(token: string, itemId: string): Promise<void> {
  const list = await getListByToken(token);
  if (!list) return;
  await reserveItem(list.id, itemId, await visitorId());
  refresh();
}

export async function releaseWishAction(token: string, itemId: string): Promise<void> {
  const list = await getListByToken(token);
  if (!list) return;
  await releaseItem(list.id, itemId, await visitorId());
  refresh();
}
