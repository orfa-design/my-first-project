"use server";

import { refresh } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createItem, deleteItem, getItem, getList, updateItem, updateList } from "@/lib/data/wishlist";
import { findPreviewImage, withPreviewImage } from "@/lib/link-preview";
import { pickFields, type FormState } from "@/lib/form";
import { firstIssue, wishItemInput, wishListPatch } from "@/lib/schemas";

export async function addWishAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const list = await getList();
  if (!list) return { error: "Вішліст не знайдено" };
  const parsed = wishItemInput.safeParse({
    ...pickFields(formData, ["title", "url", "price", "note", "priority"]),
    // Порожнє поле картинки — шукаємо прев'ю самі.
    ...(String(formData.get("image_url") ?? "").trim() ? { image_url: formData.get("image_url") } : {}),
    is_hidden: false,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await createItem(list.id, await withPreviewImage(parsed.data));
  refresh();
  return {};
}

export async function setWishHiddenAction(id: string, hidden: boolean): Promise<void> {
  await requireSession();
  await updateItem(id, { is_hidden: hidden });
  refresh();
}

/** Прибрати картинку або знайти її заново за посиланням. */
export async function setWishImageAction(id: string, mode: "remove" | "find"): Promise<void> {
  await requireSession();
  const item = await getItem(id);
  if (!item) return;
  const image_url = mode === "find" && item.url ? await findPreviewImage(item.url) : null;
  await updateItem(id, { image_url });
  refresh();
}

export async function deleteWishAction(id: string): Promise<void> {
  await requireSession();
  await deleteItem(id);
  refresh();
}

export async function updateWishListAction(id: string, formData: FormData): Promise<void> {
  await requireSession();
  const parsed = wishListPatch.safeParse(pickFields(formData, ["title", "intro"]));
  if (!parsed.success) return;
  await updateList(id, parsed.data);
  refresh();
}
