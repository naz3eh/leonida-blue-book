"use server";

import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { findCarByName, uniqueSlug } from "@/lib/cars";
import { cleanScreenshot, ImageError } from "@/lib/image";
import { getClientIp, hashIp } from "@/lib/ip";
import { checkReportRateLimit } from "@/lib/ratelimit";
import { formDataToReportInput, reportSchema } from "@/lib/schemas";
import { storeScreenshot, uploadsEnabled } from "@/lib/storage";
import { verifyTurnstile } from "@/lib/turnstile";

export type SubmitState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  carSlug?: string;
  pending?: boolean;
};

const DUPLICATE_WINDOW_MS = 24 * 3600_000;

function fail(message: string, fieldErrors?: Record<string, string>): SubmitState {
  return { status: "error", message, fieldErrors };
}

export async function submitReport(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const parsed = reportSchema.safeParse(formDataToReportInput(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return fail("Please fix the highlighted fields.", fieldErrors);
  }
  const input = parsed.data;
  const ip = await getClientIp();

  if (!(await verifyTurnstile(input.turnstileToken, ip))) {
    return fail("The spam check failed or expired. Please complete it and try again.");
  }
  if (input.website) {
    return fail("Your report could not be accepted.");
  }

  const ipHash = hashIp(ip);
  if (!(await checkReportRateLimit(ipHash))) {
    return fail("You've sent 5 reports in the last hour. Please wait a bit before sending more.");
  }

  const db = getDb();

  let existingCar: typeof schema.cars.$inferSelect | null = null;
  if (input.carId !== undefined) {
    const [car] = await db
      .select()
      .from(schema.cars)
      .where(and(eq(schema.cars.id, input.carId), eq(schema.cars.status, "approved")))
      .limit(1);
    if (!car) return fail("That car isn't in the list anymore.", { carId: "Pick a car again" });
    existingCar = car;
  } else if (input.newCarName) {
    existingCar = await findCarByName(db, input.newCarName);
  }

  if (existingCar) {
    const [dupe] = await db
      .select({ id: schema.reports.id })
      .from(schema.reports)
      .where(
        and(
          eq(schema.reports.ipHash, ipHash),
          eq(schema.reports.carId, existingCar.id),
          eq(schema.reports.source, input.source),
          gt(schema.reports.createdAt, new Date(Date.now() - DUPLICATE_WINDOW_MS)),
        ),
      )
      .limit(1);
    if (dupe) {
      return fail(
        "You already reported this car and source in the last 24 hours. Thanks, one report a day is enough.",
      );
    }
  }

  let screenshotUrl: string | null = null;
  if (input.screenshot) {
    if (!uploadsEnabled()) {
      return fail("Screenshot uploads aren't set up yet. Send the report without one.", {
        screenshot: "Uploads are unavailable",
      });
    }
    try {
      const clean = await cleanScreenshot(Buffer.from(await input.screenshot.arrayBuffer()));
      screenshotUrl = await storeScreenshot(clean);
    } catch (err) {
      if (err instanceof ImageError) return fail(err.message, { screenshot: err.message });
      console.error("screenshot upload failed", err);
      return fail("The screenshot couldn't be uploaded. Try again or send without it.");
    }
  }

  const car = await db.transaction(async (tx) => {
    let target = existingCar;
    if (!target) {
      const name = input.newCarName!;
      const [created] = await tx
        .insert(schema.cars)
        .values({ name, slug: await uniqueSlug(tx, name), status: "pending" })
        .onConflictDoNothing()
        .returning();
      target = created ?? (await findCarByName(tx, name));
      if (!target) throw new Error("Could not create car");
    }
    await tx.insert(schema.reports).values({
      carId: target.id,
      source: input.source,
      amount: input.amount,
      platform: input.platform ?? null,
      screenshotUrl,
      ipHash,
    });
    return target;
  });

  revalidatePath("/");
  revalidatePath(`/cars/${car.slug}`);

  if (car.status === "pending") {
    return {
      status: "success",
      pending: true,
      message: `Thanks! Your report for ${car.name} was saved. New cars show up after a moderator approves them.`,
    };
  }
  return {
    status: "success",
    carSlug: car.slug,
    message: `Thanks! Your report for ${car.name} was saved.`,
  };
}
