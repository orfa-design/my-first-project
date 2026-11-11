import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { Empty, Loading, PageHeader, Section } from "@/components/ui";
import { WishEditor, WishForm } from "@/components/wish-form";
import { WishCard } from "@/components/wishlist";
import { getList, listItems } from "@/lib/data/wishlist";
import {
  addWishAction,
  deleteWishAction,
  setWishHiddenAction,
  setWishImageAction,
  updateWishAction,
  updateWishListAction,
} from "./actions";

export const metadata: Metadata = { title: "Вішліст" };

export default function WishlistPage() {
  return (
    <>
      <PageHeader title="Вішліст">Ваш список бажань і публічне посилання для того, хто вибирає подарунок.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Wishlist />
      </Suspense>
    </>
  );
}

async function Wishlist() {
  await connection();
  const list = await getList();
  if (!list) return <Empty>Вішліст ще не створено — застосуйте міграцію 004 у Supabase.</Empty>;
  const items = await listItems(list.id, { includeHidden: true });
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const publicUrl = `${origin}/w/${list.share_token}`;

  return (
    <>
      <Section title="Посилання для Санти">
        <div className="card space-y-2 p-4 text-sm">
          <p className="text-muted">Відкривається без пароля й показує лише вішліст (без прихованих бажань).</p>
          <input readOnly value={publicUrl} className="input font-mono" aria-label="Публічне посилання" />
          <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-block text-accent">Відкрити, як бачить отримувач ↗</a>
        </div>
      </Section>

      <Section title="Назва й вступ">
        <form action={updateWishListAction.bind(null, list.id)} className="card space-y-3 p-4">
          <input name="title" defaultValue={list.title} className="input" aria-label="Назва" required />
          <textarea
            name="intro"
            rows={2}
            defaultValue={list.intro ?? ""}
            className="input"
            placeholder="Кілька слів для того, хто вибирає: розміри, що точно не треба…"
            aria-label="Вступ"
          />
          <button className="btn-secondary">Зберегти</button>
        </form>
      </Section>

      <Section title="Додати бажання">
        <WishForm action={addWishAction} />
      </Section>

      <Section title="Бажання" count={items.length}>
        {items.length ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <WishCard
                key={item.id}
                item={item}
                actions={
                  <>
                    <WishEditor item={item} action={updateWishAction.bind(null, item.id)} />
                    <form action={setWishHiddenAction.bind(null, item.id, !item.is_hidden)}>
                      <button className="btn-secondary px-2.5 py-1 text-xs">
                        {item.is_hidden ? "Показати в публічному списку" : "Приховати"}
                      </button>
                    </form>
                    {item.image_url ? (
                      <form action={setWishImageAction.bind(null, item.id, "remove")}>
                        <button className="btn-secondary px-2.5 py-1 text-xs">Прибрати картинку</button>
                      </form>
                    ) : (
                      item.url && (
                        <form action={setWishImageAction.bind(null, item.id, "find")}>
                          <button className="btn-secondary px-2.5 py-1 text-xs">Знайти картинку</button>
                        </form>
                      )
                    )}
                    <form action={deleteWishAction.bind(null, item.id)}>
                      <button className="btn-danger px-2.5 py-1 text-xs">Видалити</button>
                    </form>
                  </>
                }
              />
            ))}
          </ul>
        ) : (
          <Empty>Поки порожньо. Додайте перше бажання формою вище або надішліть Claude посилання на річ.</Empty>
        )}
      </Section>
    </>
  );
}
