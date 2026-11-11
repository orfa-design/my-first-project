import { randomBytes } from "node:crypto";
import { db } from "../db";
import type { WishItemInput, WishItemPatch, WishListPatch } from "../schemas";
import type { WishItem, WishList } from "../types";

// Вішліст — окремий підпроєкт. Поки список один: перший створений.

export async function getList(): Promise<WishList | null> {
  const [row] = await db()<WishList[]>`select * from wl_lists order by created_at limit 1`;
  return row ?? null;
}

/** Для публічної сторінки: список лише за точним ключем посилання. */
export async function getListByToken(token: string): Promise<WishList | null> {
  const [row] = await db()<WishList[]>`select * from wl_lists where share_token = ${token}`;
  return row ?? null;
}

/** Бажання списку: спершу важливіші, далі новіші. Приховані — лише якщо явно попросили. */
export async function listItems(listId: string, { includeHidden = false } = {}): Promise<WishItem[]> {
  const sql = db();
  return sql<WishItem[]>`
    select * from wl_items
    where list_id = ${listId} ${includeHidden ? sql`` : sql`and not is_hidden`}
    order by case priority when 'high' then 0 when 'normal' then 1 when 'low' then 2 else 1 end, created_at desc`;
}

export async function getItem(id: string): Promise<WishItem | null> {
  const [row] = await db()<WishItem[]>`select * from wl_items where id = ${id}`;
  return row ?? null;
}

export async function createItem(listId: string, input: WishItemInput): Promise<WishItem> {
  const sql = db();
  const [row] = await sql<WishItem[]>`insert into wl_items ${sql({ ...input, list_id: listId })} returning *`;
  return row;
}

export async function updateItem(id: string, patch: WishItemPatch): Promise<WishItem | null> {
  if (Object.keys(patch).length === 0) return getItem(id);
  const sql = db();
  const [row] = await sql<WishItem[]>`update wl_items set ${sql(patch)} where id = ${id} returning *`;
  return row ?? null;
}

export async function deleteItem(id: string): Promise<void> {
  await db()`delete from wl_items where id = ${id}`;
}

export async function updateList(id: string, patch: WishListPatch): Promise<WishList | null> {
  const sql = db();
  if (Object.keys(patch).length === 0) {
    const [row] = await sql<WishList[]>`select * from wl_lists where id = ${id}`;
    return row ?? null;
  }
  const [row] = await sql<WishList[]>`update wl_lists set ${sql(patch)} where id = ${id} returning *`;
  return row ?? null;
}

/** Новий ключ посилання: старе посилання перестає працювати. */
export async function regenerateToken(id: string): Promise<WishList | null> {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const token = [...randomBytes(12)].map((b) => alphabet[b % alphabet.length]).join("");
  const [row] = await db()<WishList[]>`update wl_lists set share_token = ${token} where id = ${id} returning *`;
  return row ?? null;
}

/** «Я беру це»: бронює видиме бажання списку, якщо його ще ніхто не взяв. */
export async function reserveItem(listId: string, itemId: string, visitor: string): Promise<boolean> {
  const rows = await db()`
    update wl_items set reserved_at = now(), reserved_by = ${visitor}
    where id = ${itemId} and list_id = ${listId} and not is_hidden and reserved_at is null
    returning id`;
  return rows.length > 0;
}

/** Скасувати бронь може лише той самий браузер, що її зробив. */
export async function releaseItem(listId: string, itemId: string, visitor: string): Promise<void> {
  await db()`
    update wl_items set reserved_at = null, reserved_by = null
    where id = ${itemId} and list_id = ${listId} and reserved_by = ${visitor}`;
}
