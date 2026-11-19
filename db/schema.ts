import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const carStatus = pgEnum("car_status", ["approved", "pending"]);
export const reportSource = pgEnum("report_source", ["waink", "fence", "randy"]);
export const reportPlatform = pgEnum("report_platform", ["ps5", "xbox"]);
export const reportStatus = pgEnum("report_status", ["visible", "hidden"]);

export const cars = pgTable(
  "cars",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    class: text("class"),
    status: carStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cars_name_lower_idx").on(sql`lower(${t.name})`),
    index("cars_status_idx").on(t.status),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    carId: integer("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    source: reportSource("source").notNull(),
    amount: integer("amount").notNull(),
    platform: reportPlatform("platform"),
    screenshotUrl: text("screenshot_url"),
    ipHash: text("ip_hash").notNull(),
    status: reportStatus("status").notNull().default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reports_car_idx").on(t.carId, t.status, t.createdAt),
    index("reports_ip_idx").on(t.ipHash, t.createdAt),
    index("reports_created_idx").on(t.createdAt),
  ],
);

export type Car = typeof cars.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Source = (typeof reportSource.enumValues)[number];
export type Platform = (typeof reportPlatform.enumValues)[number];
