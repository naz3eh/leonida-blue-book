import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "lbb_admin";

function adminToken(): string | null {
  const token = process.env.ADMIN_TOKEN;
  return token && token.length >= 12 ? token : null;
}

function sessionValue(token: string): string {
  return createHmac("sha256", token).update("leonida-blue-book-admin").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminConfigured(): boolean {
  return adminToken() !== null;
}

export function checkAdminToken(candidate: string): string | null {
  const token = adminToken();
  if (!token || !safeEqual(candidate, token)) return null;
  return sessionValue(token);
}

export async function isAdmin(): Promise<boolean> {
  const token = adminToken();
  if (!token) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value && safeEqual(value, sessionValue(token)));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Not authorized");
}
