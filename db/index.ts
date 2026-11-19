import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { lbbDb?: Db };

export function getDb(): Db {
  if (globalForDb.lbbDb) return globalForDb.lbbDb;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { prepare: false, max: 5 });
  const db = drizzle(client, { schema });
  globalForDb.lbbDb = db;
  return db;
}

export { schema };
