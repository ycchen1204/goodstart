import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.log("Database migrations skipped: SUPABASE_DB_PASSWORD is not set.");
  process.exit(0);
}

const client = new pg.Client({
  host: "db.lwzptiqgtfxvkdyasjcm.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password,
  ssl: { rejectUnauthorized: true },
});

await client.connect();
const directory = new URL("../supabase/migrations/", import.meta.url);
for (const file of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
  await client.query(await readFile(join(directory.pathname, file), "utf8"));
  console.log(`Applied ${file}`);
}
await client.end();
