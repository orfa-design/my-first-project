import "./load-env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/lib/db";

// Застосовує SQL-файли з db/migrations у алфавітному порядку, кожен — один раз.
async function main() {
  const sql = db();
  await sql`create table if not exists sh_schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`;
  await sql`alter table sh_schema_migrations enable row level security`;
  const applied = new Set((await sql<{ name: string }[]>`select name from sh_schema_migrations`).map((r) => r.name));

  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const body = await readFile(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into sh_schema_migrations (name) values (${file})`;
    });
    console.log(`✓ ${file}`);
  }
  console.log("Міграції актуальні.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
