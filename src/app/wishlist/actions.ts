"use server";

import { refresh } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createItem, deleteItem, getList, updateItem, updateList } from "@/lib/data/wishlist";
import { pickFields, type FormState } from "@/lib/form";
import { firstIssue, wishItemInput, wishListPatch } from "@/lib/schemas";

export async function addWishAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const list = await getList();
  if (!list) return { error: "Вішліст не знайдено" };
  const parsed = wishItemInput.safeParse({
    ...pickFields(formData, ["title", "url", "price", "note", "priority"]),
    is_hidden: false,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await createItem(list.id, parsed.data);
  refresh();
  return {};
}

export async function setWishHiddenAction(id: string, hidden: boolean): Promise<void> {
  await requireSession();
  await updateItem(id, { is_hidden: hidden });
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
