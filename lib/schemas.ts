import { z } from "zod";
import { normalizeCarName } from "./normalize";

export const MAX_AMOUNT = 10_000_000;
export const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
export const SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

export const screenshotSchema = z
  .custom<File>(
    (v) => typeof File !== "undefined" && v instanceof File,
    "Screenshot must be a file",
  )
  .refine((f) => f.size <= MAX_SCREENSHOT_BYTES, "Screenshot must be 2 MB or smaller")
  .refine(
    (f) => (SCREENSHOT_TYPES as readonly string[]).includes(f.type),
    "Screenshot must be a PNG, JPEG or WebP image",
  );

export const carNameSchema = z
  .string()
  .transform(normalizeCarName)
  .pipe(
    z
      .string()
      .min(2, "Car name must be at least 2 characters")
      .max(60, "Car name must be 60 characters or fewer")
      .regex(/^[\p{L}\p{N} .'&\-/()]+$/u, "Car name has characters we don't accept"),
  );

export const reportSchema = z
  .object({
    carId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    newCarName: z.preprocess(emptyToUndefined, carNameSchema.optional()),
    source: z.enum(["waink", "fence", "randy"], { error: "Pick where the price came from" }),
    amount: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/[$,\s]/g, "") : v),
      z.coerce
        .number({ error: "Enter the amount as a whole number" })
        .int("Enter the amount as a whole number")
        .min(1, "Amount must be at least $1")
        .max(MAX_AMOUNT, "Amount must be $10,000,000 or less"),
    ),
    platform: z.preprocess(emptyToUndefined, z.enum(["ps5", "xbox"]).optional()),
    screenshot: z.preprocess(
      (v) =>
        v === null || v === "" || (typeof File !== "undefined" && v instanceof File && v.size === 0)
          ? undefined
          : v,
      screenshotSchema.optional(),
    ),
    website: z.preprocess(emptyToUndefined, z.string().optional()),
    turnstileToken: z.preprocess(emptyToUndefined, z.string().max(2048).optional()),
  })
  .refine((d) => d.carId !== undefined || d.newCarName !== undefined, {
    message: "Pick a car or add a new one",
    path: ["carId"],
  });

export type ReportInput = z.infer<typeof reportSchema>;

export function formDataToReportInput(fd: FormData): Record<string, unknown> {
  return {
    carId: fd.get("carId"),
    newCarName: fd.get("newCarName"),
    source: fd.get("source") ?? undefined,
    amount: fd.get("amount"),
    platform: fd.get("platform"),
    screenshot: fd.get("screenshot"),
    website: fd.get("website"),
    turnstileToken: fd.get("cf-turnstile-response"),
  };
}
