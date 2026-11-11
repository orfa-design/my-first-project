import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading, Prose } from "@/components/ui";
import { WishCard } from "@/components/wishlist";
import { getListByToken, listItems } from "@/lib/data/wishlist";

// Публічна сторінка вішліста: відкривається без пароля за випадковим ключем у посиланні
// (proxy її пропускає), показує лише цей список і нічого не дозволяє змінювати.

export const metadata: Metadata = { title: "Вішліст", robots: { index: false, follow: false } };

export default function PublicWishlistPage({ params }: PageProps<"/w/[token]">) {
  return (
    // Окреме полотно поверх загального макета: без меню й відступу під нього.
    <div className="fixed inset-0 z-20 overflow-y-auto bg-bg">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <Suspense fallback={<Loading />}>
          <PublicWishlist params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function PublicWishlist({ params }: { params: PageProps<"/w/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  if (!/^[a-z0-9]{8,64}$/.test(token)) notFound();
  const list = await getListByToken(token);
  if (!list) notFound();
  const items = await listItems(list.id);

  return (
    <article>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">🎁 {list.title}</h1>
      {list.intro && (
        <div className="mb-6 text-muted">
          <Prose>{list.intro}</Prose>
        </div>
      )}
      {items.length ? (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <WishCard key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center text-muted">
          Вішліст ще наповнюється — зазирніть трохи пізніше ✨
        </p>
      )}
    </article>
  );
}
