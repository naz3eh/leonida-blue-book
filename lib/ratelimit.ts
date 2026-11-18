import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { and, count, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const REPORTS_PER_HOUR = 5;

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  // The Vercel Marketplace Upstash integration injects KV_REST_API_*; accept either name.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.warn("Upstash is not configured; falling back to a database rate limit.");
    limiter = null;
    return limiter;
  }
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(REPORTS_PER_HOUR, "1 h"),
    prefix: "lbb:reports",
  });
  return limiter;
}

export async function checkReportRateLimit(ipHash: string): Promise<boolean> {
  const rl = getLimiter();
  if (rl) {
    try {
      const { success } = await rl.limit(ipHash);
      return success;
    } catch (err) {
      console.error("Upstash rate limit failed; falling back to the database count.", err);
    }
  }
  const since = new Date(Date.now() - 3600_000);
  const [row] = await getDb()
    .select({ n: count() })
    .from(schema.reports)
    .where(and(eq(schema.reports.ipHash, ipHash), gt(schema.reports.createdAt, since)));
  return (row?.n ?? 0) < REPORTS_PER_HOUR;
}
