"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDb, schema } from "@/db";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, checkAdminToken, requireAdmin } from "@/lib/admin-auth";
import { findCarByName, uniqueSlug } from "@/lib/cars";
import { carNameSchema } from "@/lib/schemas";

export type AdminState = { status: "idle" | "success" | "error"; message: string };

function refresh(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/cars/${slug}`);
}

export async function login(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = checkAdminToken(String(formData.get("token") ?? ""));
  if (!session) return { status: "error", message: "That token is not right." };
  (await cookies()).set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  revalidatePath("/admin");
  return { status: "success", message: "Signed in." };
}

export async function logout(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  revalidatePath("/admin");
}

export async function approveCar(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("carId"));
  const [car] = await getDb()
    .update(schema.cars)
    .set({ status: "approved" })
    .where(and(eq(schema.cars.id, id), eq(schema.cars.status, "pending")))
    .returning();
  refresh(car?.slug);
}

export async function renameCar(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = Number(formData.get("carId"));
  const parsed = carNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const name = parsed.data;
  const db = getDb();
  const clash = await findCarByName(db, name);
  if (clash && clash.id !== id) {
    return { status: "error", message: `${clash.name} already exists. Merge into it instead.` };
  }
  const [car] = await db
    .update(schema.cars)
    .set({ name, slug: await uniqueSlug(db, name, id) })
    .where(and(eq(schema.cars.id, id), eq(schema.cars.status, "pending")))
    .returning();
  if (!car) return { status: "error", message: "Only pending cars can be renamed." };
  refresh(car.slug);
  return { status: "success", message: `Renamed to ${name}.` };
}

export async function mergeCar(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const sourceId = Number(formData.get("carId"));
  const targetId = Number(formData.get("targetId"));
  if (!targetId || targetId === sourceId) return { status: "error", message: "Pick a car to merge into." };
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    // Lock the pending car so a report saved mid-merge can't be cascade-deleted with it.
    const [source] = await tx
      .select({ id: schema.cars.id })
      .from(schema.cars)
      .where(and(eq(schema.cars.id, sourceId), eq(schema.cars.status, "pending")))
      .for("update");
    if (!source) return "not-pending" as const;
    const [target] = await tx
      .select()
      .from(schema.cars)
      .where(and(eq(schema.cars.id, targetId), eq(schema.cars.status, "approved")))
      .limit(1);
    if (!target) return null;
    await tx.update(schema.reports).set({ carId: target.id }).where(eq(schema.reports.carId, sourceId));
    await tx.delete(schema.cars).where(eq(schema.cars.id, sourceId));
    return target;
  });
  if (result === "not-pending") return { status: "error", message: "Only pending cars can be merged." };
  if (!result) return { status: "error", message: "That car is not approved." };
  refresh(result.slug);
  return { status: "success", message: `Merged into ${result.name}.` };
}

export async function setReportStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("reportId"));
  const status = formData.get("status") === "hidden" ? "hidden" : "visible";
  const [row] = await getDb()
    .update(schema.reports)
    .set({ status })
    .where(eq(schema.reports.id, id))
    .returning({ carId: schema.reports.carId });
  if (row) {
    const [car] = await getDb().select({ slug: schema.cars.slug }).from(schema.cars).where(eq(schema.cars.id, row.carId));
    refresh(car?.slug);
  }
}
