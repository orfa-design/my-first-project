import { HubError, runHubCommand } from "@/lib/hub";
import { passwordMatches } from "@/lib/session";

// Вхід для CLI (scripts/hub.ts) з місць, де немає прямого доступу до бази.
// Захищено тим самим паролем APP_PASSWORD, що й сайт (заголовок Authorization: Bearer).

async function authorized(header: string | null): Promise<boolean> {
  if (!header?.startsWith("Bearer ")) return false;
  return passwordMatches(header.slice("Bearer ".length));
}

const bodySchema = (body: unknown): body is { argv: string[]; stdin?: string } =>
  typeof body === "object" &&
  body !== null &&
  Array.isArray((body as { argv?: unknown }).argv) &&
  (body as { argv: unknown[] }).argv.every((a) => typeof a === "string") &&
  ["undefined", "string"].includes(typeof (body as { stdin?: unknown }).stdin);

export async function POST(request: Request) {
  if (!(await authorized(request.headers.get("authorization")))) {
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
