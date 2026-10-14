// Сесія для одного користувача: підписаний HMAC-ом термін дії в cookie.
// Використовує лише Web Crypto, тому працює і в proxy, і в серверних функціях.

export const SESSION_COOKIE = "studyhub_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 днів

const encoder = new TextEncoder();

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET не задано або він коротший за 32 символи");
  }
  return value;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const expires = String(Math.floor(now / 1000) + SESSION_MAX_AGE);
  return `${expires}.${await hmac(expires)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) * 1000 < now) return false;
  return timingSafeEqual(sig, await hmac(expires));
}

/** Порівняння пароля без витоку часу; обидва значення спершу хешуються до однакової довжини. */
export async function passwordMatches(candidate: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD не задано");
  const [a, b] = await Promise.all([hmac(`pw:${candidate}`), hmac(`pw:${expected}`)]);
  return timingSafeEqual(a, b);
}
