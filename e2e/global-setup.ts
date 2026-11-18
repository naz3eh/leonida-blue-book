import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { E2E_ENV } from "../playwright.config";

export default async function globalSetup() {
  const client = postgres(E2E_ENV.DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: path.join(__dirname, "..", "db", "migrations") });
    await client`truncate table reports, cars restart identity cascade`;
  } finally {
    await client.end();
  }
}
