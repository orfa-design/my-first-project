import { HubError, runHubCommand } from "@/lib/hub";

// Вхід для CLI (scripts/hub.ts) з місць, де немає прямого доступу до бази.
// Захищено окремим токеном HUB_TOKEN, а не сесією браузера.

function tokenMatches(header: string | null): boolean {
  const expected = process.env.HUB_TOKEN;
  if (!expected || expected.length < 32 || !header?.startsWith("Bearer ")) return false;
  const given = header.slice("Bearer ".length);
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

const bodySchema = (body: unknown): body is { argv: string[]; stdin?: string } =>
  typeof body === "object" &&
  body !== null &&
  Array.isArray((body as { argv?: unknown }).argv) &&
  (body as { argv: unknown[] }).argv.every((a) => typeof a === "string") &&
  ["undefined", "string"].includes(typeof (body as { stdin?: unknown }).stdin);

export async function POST(request: Request) {
  if (!tokenMatches(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!bodySchema(body)) {
    return Response.json({ error: "Очікувалось { argv: string[], stdin?: string }" }, { status: 400 });
  }
  try {
    return Response.json({ result: await runHubCommand(body.argv, body.stdin) });
  } catch (err) {
    if (err instanceof HubError) {
      return Response.json({ error: err.message, details: err.details, code: err.code }, { status: 422 });
    }
    console.error(err);
    return Response.json({ error: "Внутрішня помилка" }, { status: 500 });
  }
}
