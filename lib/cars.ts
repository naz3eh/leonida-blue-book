import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { slugify } from "./normalize";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type DbLike = ReturnType<typeof getDb> | Tx;

export async function findCarByName(db: DbLike, name: string) {
  const [car] = await db
    .select()
    .from(schema.cars)
    .where(sql`lower(${schema.cars.name}) = lower(${name})`)
    .limit(1);
  return car ?? null;
}

export async function uniqueSlug(db: DbLike, name: string, excludeId?: number): Promise<string> {
  const base = slugify(name);
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const [hit] = await db
      .select({ id: schema.cars.id })
      .from(schema.cars)
      .where(eq(schema.cars.slug, candidate))
      .limit(1);
    if (!hit || hit.id === excludeId) return candidate;
  }
  throw new Error("Could not create a unique slug");
}
