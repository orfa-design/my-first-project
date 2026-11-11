// Картинка-прев'ю сторінки магазину: те саме зображення, яке показують месенджери
// (og:image / twitter:image, або image з опису товару JSON-LD).

const MAX_BYTES = 768 * 1024;
const META_KEYS = ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src", "image"];

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/\\\//g, "/")
    .trim();

/** Адреса картинки з HTML сторінки або null. Відносні адреси розв'язуються від pageUrl. */
export function extractPreviewImage(html: string, pageUrl: string): string | null {
  const found: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    const value = content?.[1] ?? content?.[2];
    if (key && value && !(key in found)) found[key] = value;
  }
  let candidate = META_KEYS.map((k) => found[k]).find(Boolean);

  if (!candidate) {
    for (const [, json] of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      const m = /"image"\s*:\s*(?:\[\s*)?(?:\{[^}]*?"url"\s*:\s*)?"([^"]+)"/.exec(json);
      if (m) {
        candidate = m[1];
        break;
      }
    }
  }
  if (!candidate) candidate = /<link\b[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1];
  if (!candidate) return null;

  try {
    const url = new URL(decode(candidate), pageUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Завантажує сторінку (до ~6 с, перші ~768 КБ) і шукає картинку. Будь-яка помилка — null. */
export async function findPreviewImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; StudyHubWishlist/1.0; link preview)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "uk,en;q=0.8",
      },
    });
    if (!res.ok || !res.body || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
      // Мета-теги — у <head>; далі читати не треба.
      if (new TextDecoder().decode(value).includes("</head>") && size > 4096) break;
    }
    await reader.cancel().catch(() => {});
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return extractPreviewImage(html, res.url || pageUrl);
  } catch {
    return null;
  }
}

/**
 * Доповнює дані бажання картинкою: якщо є посилання, а картинку явно не передали — шукає прев'ю.
 * Якщо посилання прибрали — прибирає й картинку.
 */
export async function withPreviewImage<T extends { url?: string | null; image_url?: string | null }>(data: T): Promise<T> {
  if (data.image_url !== undefined) return data;
  if (data.url === null) return { ...data, image_url: null };
  if (data.url) return { ...data, image_url: await findPreviewImage(data.url) };
  return data;
}
