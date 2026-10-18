import "./load-env";
import { readFileSync } from "node:fs";

// CLI для роботи AI з даними Study Hub. Усі відповіді — JSON у stdout.
// Довідка: npm run hub -- help
//
// Два режими:
//  • DATABASE_URL задано → команди виконуються напряму в базі (локальна розробка);
//  • інакше HUB_URL + APP_PASSWORD → команди йдуть на розгорнутий застосунок через POST /api/hub
//    (у хмарних сесіях Claude Code прямого з'єднання з Postgres немає, лише HTTPS).

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const stdin = argv.includes("-") ? readFileSync(0, "utf8") : undefined;

  if (process.env.DATABASE_URL) {
    const { runHubCommand, HubError } = await import("../src/lib/hub");
    const { db } = await import("../src/lib/db");
    try {
      print(await runHubCommand(argv, stdin));
      return 0;
    } catch (err) {
      if (err instanceof HubError) {
        console.error(JSON.stringify({ error: err.message, details: err.details }, null, 2));
        return err.code;
      }
      throw err;
    } finally {
      await db().end({ timeout: 1 });
    }
  }

  const url = process.env.HUB_URL;
  const token = process.env.APP_PASSWORD;
  if (!url || !token) {
    console.error("Задайте DATABASE_URL (напряму) або HUB_URL і APP_PASSWORD (через застосунок). Див. README.");
    return 1;
  }
  const res = await fetch(new URL("/api/hub", url), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ argv, stdin }),
  });
  const payload = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) {
    console.error(JSON.stringify(payload, null, 2));
    return payload.code ?? 1;
  }
  print(payload.result);
  return 0;
}

function print(result: unknown) {
  console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(err);
    process.exitCode = 1;
  },
);
