import { extractPreviewImage } from "./link-preview";

// Що можна дізнатися зі сторінки події (квитки, афіша): назва, опис, зображення й дані з JSON-LD
// (schema.org Event — їх сайти квитків пишуть для Google: дата, час, місце, ціна).
// Працює на сервері сайту: у хмарного середовища Claude доступ до інтернету обмежений.

const MAX_PAGE_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UA = "Mozilla/5.0 (compatible; MyCalendar/1.0; +link preview)";

export type PageEvent = {
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  place: string | null;
  address: string | null;
  price: string | null;
  url: string | null;
};

export type PageInfo = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  /** Події з JSON-LD; кілька — якщо на сторінці кілька сеансів. */
  events: PageEvent[];
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, keys: string[]): string | null {
  const found: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const m = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    const value = m?.[1] ?? m?.[2];
    if (key && value && !(key in found)) found[key] = value;
  }
  const v = keys.map((k) => found[k]).find(Boolean);
  return v ? decode(v) : null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? decode(v) : typeof v === "number" ? String(v) : null);

function addressOf(a: unknown): string | null {
  if (typeof a === "string") return decode(a);
  if (a && typeof a === "object") {
    const o = a as Record<string, unknown>;
    return [o.streetAddress, o.addressLocality].map(str).filter(Boolean).join(", ") || null;
  }
  return null;
}

function priceOf(offers: unknown): string | null {
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  const prices = list
    .map((o) => o as Record<string, unknown>)
    .map((o) => {
      const p = str(o.price) ?? str(o.lowPrice);
      return p ? `${p}${o.priceCurrency ? ` ${str(o.priceCurrency)}` : ""}` : null;
    })
    .filter(Boolean);
  return prices.length ? [...new Set(prices)].join(" / ") : null;
}

/** Обходить JSON-LD і збирає об'єкти з @type, що закінчується на «Event». */
function collectEvents(node: unknown, out: PageEvent[]) {
  if (Array.isArray(node)) return node.forEach((n) => collectEvents(n, out));
  if (!node || typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  const types = ([] as unknown[]).concat(o["@type"] ?? []).map(String);
  if (types.some((t) => /Event$/.test(t))) {
    const loc = (Array.isArray(o.location) ? o.location[0] : o.location) as Record<string, unknown> | string | undefined;
    out.push({
      name: str(o.name),
      startDate: str(o.startDate),
      endDate: str(o.endDate),
      place: typeof loc === "string" ? decode(loc) : str(loc?.name),
      address: typeof loc === "object" ? addressOf(loc?.address) : null,
      price: priceOf(o.offers),
      url: str(o.url),
    });
  }
  for (const key of ["@graph", "subEvent", "itemListElement", "item"]) if (o[key]) collectEvents(o[key], out);
}

export function parsePage(html: string, pageUrl: string): PageInfo {
  const events: PageEvent[] = [];
  for (const [, json] of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      collectEvents(JSON.parse(json.trim()), events);
    } catch {
      // Зламаний JSON-LD трапляється — пропускаємо.
    }
  }
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  return {
    url: pageUrl,
    title: meta(html, ["og:title", "twitter:title"]) ?? (titleTag ? decode(titleTag) : null),
    description: meta(html, ["og:description", "description", "twitter:description"]),
    image: extractPreviewImage(html, pageUrl),
    events,
  };
}

async function readLimited(res: Response, max: number): Promise<Buffer> {
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size <= max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  if (size > max) throw new Error("Завеликий файл");
  return Buffer.concat(chunks);
}

/** Завантажує сторінку й розбирає її. */
export async function readPage(url: string): Promise<PageInfo> {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
    headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "uk,en;q=0.8" },
  });
  if (!res.ok) throw new Error(`Сторінка відповіла ${res.status}`);
  if (!(res.headers.get("content-type") ?? "").includes("html")) throw new Error("Це не вебсторінка");
  const html = new TextDecoder().decode(await readLimited(res, MAX_PAGE_BYTES).catch(() => Buffer.alloc(0)));
  return parsePage(html, res.url || url);
}

/**
 * Завантажує зображення за адресою; велике зменшує до 1600 px (JPEG), якщо на сервері є sharp.
 * Повертає не більше 3 МБ.
 */
export async function downloadImage(url: string): Promise<{ mime: string; data: Buffer }> {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000), headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`Зображення відповіло ${res.status}`);
  const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!/^image\/(jpeg|png|webp|gif)$/.test(mime)) throw new Error(`Це не зображення (${mime || "невідомий тип"})`);
  let data = await readLimited(res, MAX_IMAGE_BYTES);
  let type = mime;
  if (mime !== "image/gif" && data.length > 600 * 1024) {
    try {
      const sharp = (await import("sharp")).default;
      data = await sharp(data).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      type = "image/jpeg";
    } catch {
      // sharp недоступний — лишаємо як є (нижче перевірка розміру).
    }
  }
  if (data.length > 3 * 1024 * 1024) throw new Error("Зображення завелике (понад 3 МБ)");
  return { mime: type, data };
}
