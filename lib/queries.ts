import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Source } from "@/db/schema";
import { computeStats, type SourceStats } from "./stats";
import { SOURCES } from "./sources";

const { cars, reports } = schema;

export type CarListItem = {
  id: number;
  slug: string;
  name: string;
  class: string | null;
  reportCount: number;
  stats: SourceStats;
};

export async function listApprovedCars(): Promise<CarListItem[]> {
  const rows = await getDb()
    .select({
      id: cars.id,
      slug: cars.slug,
      name: cars.name,
      class: cars.class,
      amounts: sql<number[]>`coalesce(array_agg(${reports.amount}) filter (where ${reports.id} is not null), '{}')`,
    })
    .from(cars)
    .leftJoin(reports, and(eq(reports.carId, cars.id), eq(reports.status, "visible")))
    .where(eq(cars.status, "approved"))
    .groupBy(cars.id);
  return rows
    .map((r) => {
      const amounts = r.amounts.map(Number);
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        class: r.class,
        reportCount: amounts.length,
        stats: computeStats(amounts),
      };
    })
    .sort((a, b) => b.reportCount - a.reportCount || a.name.localeCompare(b.name));
}

export type PublicReport = {
  id: number;
  source: Source;
  amount: number;
  platform: "ps5" | "xbox" | null;
  screenshotUrl: string | null;
  createdAt: Date;
  carName: string;
  carSlug: string;
};

const publicReportFields = {
  id: reports.id,
  source: reports.source,
  amount: reports.amount,
  platform: reports.platform,
  screenshotUrl: reports.screenshotUrl,
  createdAt: reports.createdAt,
  carName: cars.name,
  carSlug: cars.slug,
};

export async function recentReports(limit = 20): Promise<PublicReport[]> {
  return getDb()
    .select(publicReportFields)
    .from(reports)
    .innerJoin(cars, eq(cars.id, reports.carId))
    .where(and(eq(reports.status, "visible"), eq(cars.status, "approved")))
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(limit);
}

export async function getApprovedCarBySlug(slug: string) {
  const [car] = await getDb()
    .select()
    .from(cars)
    .where(and(eq(cars.slug, slug), eq(cars.status, "approved")))
    .limit(1);
  return car ?? null;
}

export const RANGE_DAYS = 30;
export type Range = "30d" | "all";

export type CarDetail = {
  stats: Record<Source, SourceStats>;
  totalReports: number;
  reports: PublicReport[];
};

export async function getCarDetail(carId: number, range: Range): Promise<CarDetail> {
  const conditions = [eq(reports.carId, carId), eq(reports.status, "visible")];
  if (range === "30d") {
    conditions.push(gte(reports.createdAt, new Date(Date.now() - RANGE_DAYS * 86400_000)));
  }
  const rows = await getDb()
    .select(publicReportFields)
    .from(reports)
    .innerJoin(cars, eq(cars.id, reports.carId))
    .where(and(...conditions))
    .orderBy(desc(reports.createdAt), desc(reports.id));
  const stats = Object.fromEntries(
    SOURCES.map((s) => [s, computeStats(rows.filter((r) => r.source === s).map((r) => r.amount))]),
  ) as Record<Source, SourceStats>;
  return { stats, totalReports: rows.length, reports: rows.slice(0, 50) };
}

export async function listCarOptions() {
  return getDb()
    .select({ id: cars.id, slug: cars.slug, name: cars.name })
    .from(cars)
    .where(eq(cars.status, "approved"))
    .orderBy(cars.name);
}

export async function listPendingCars() {
  return getDb()
    .select({
      id: cars.id,
      slug: cars.slug,
      name: cars.name,
      createdAt: cars.createdAt,
      reportCount: sql<number>`count(${reports.id})::int`,
    })
    .from(cars)
    .leftJoin(reports, eq(reports.carId, cars.id))
    .where(eq(cars.status, "pending"))
    .groupBy(cars.id)
    .orderBy(desc(cars.createdAt));
}

export async function listLatestReportsForAdmin(limit = 100) {
  return getDb()
    .select({
      id: reports.id,
      source: reports.source,
      amount: reports.amount,
      platform: reports.platform,
      screenshotUrl: reports.screenshotUrl,
      status: reports.status,
      createdAt: reports.createdAt,
      ipHash: reports.ipHash,
      carName: cars.name,
      carSlug: cars.slug,
      carStatus: cars.status,
    })
    .from(reports)
    .innerJoin(cars, eq(cars.id, reports.carId))
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(limit);
}
