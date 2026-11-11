import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type CSSProperties } from "react";
import { Prose } from "@/components/ui";
import { getListByToken, listItems } from "@/lib/data/wishlist";
import type { WishItem } from "@/lib/types";
import { giftText, giftTitle, xmasHand, xmasText, xmasTitle } from "./fonts";
import { ThemedWishlist } from "./themed-wishlist";
import "./wishlist.css";

// Публічна сторінка вішліста: відкривається без пароля за випадковим ключем у посиланні
// (proxy її пропускає), показує лише цей список і нічого не дозволяє змінювати.

export const metadata: Metadata = { title: "Вішліст", robots: { index: false, follow: false } };

const FONT_CLASSES = [xmasTitle, xmasText, xmasHand, giftTitle, giftText].map((f) => f.variable).join(" ");

// Подарункове оформлення: кольори коробок по черзі (фон, тінь).
const BOXES: [string, string][] = [
  ["#ffb3c6", "#e48aa3"],
  ["#b9e4c9", "#8cc6a2"],
  ["#c9d7ff", "#9fb3ee"],
  ["#ffe29a", "#e8c46a"],
  ["#e3c9ff", "#c3a3ea"],
];
// Новорічне: марки на конвертах по черзі.
const STAMPS = ["🎄", "⛄", "🎁", "⭐", "🦌"];

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function PublicWishlistPage({ params }: PageProps<"/w/[token]">) {
  return (
    <Suspense fallback={<div className={`wl ${FONT_CLASSES}`} data-theme="xmas" />}>
      <PublicWishlist params={params} />
    </Suspense>
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
    <ThemedWishlist
      title={list.title}
      fontClasses={FONT_CLASSES}
      intro={list.intro ? <div className="wl-intro"><Prose>{list.intro}</Prose></div> : null}
    >
      {items.length ? (
        <ul className="wl-list">
          {items.map((item, i) => (
            <WishTag key={item.id} item={item} index={i} />
          ))}
        </ul>
      ) : (
        <p className="wl-empty">Вішліст ще наповнюється — зазирніть трохи пізніше ✨</p>
      )}
    </ThemedWishlist>
  );
}

function WishTag({ item, index }: { item: WishItem; index: number }) {
  const [c, d] = BOXES[index % BOXES.length];
  const style = { "--wl-c": c, "--wl-d": d } as CSSProperties;
  return (
    <li className="wl-item" style={style}>
      <span className="wl-bow" aria-hidden>🎀</span>
      {item.priority === "high" && <span className="wl-fav" />}
      {item.priority === "low" && <span className="wl-low" />}
      <span className={`wl-stamp ${item.image_url ? "wl-stamp-img" : ""}`} aria-hidden>
        {item.image_url ? <Picture src={item.image_url} /> : STAMPS[index % STAMPS.length]}
      </span>
      <div className="wl-card">
        {item.image_url && (
          <div className="wl-pic">
            <Picture src={item.image_url} />
          </div>
        )}
        <div className="wl-to">Дорогий Санто, хочу…</div>
        <div className="wl-name">{item.title}</div>
        {item.price && <span className="wl-price">{item.price}</span>}
        {item.priority === "high" && <span className="wl-mark wl-mark-high">дуже хочу!</span>}
        {item.priority === "low" && <span className="wl-mark wl-mark-low">запасний варіант</span>}
        {item.note && (
          <div className="wl-note">
            <Prose>{item.note}</Prose>
          </div>
        )}
        {item.url && (
          <a className="wl-go" href={item.url} target="_blank" rel="noreferrer">
            Переглянути на {host(item.url)}
          </a>
        )}
      </div>
    </li>
  );
}

/** Картинка з сайту магазину — звичайний <img>: адреса зовнішня й довільна. */
function Picture({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />;
}
