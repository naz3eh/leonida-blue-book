import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "lbb_admin";

function adminToken(): string | null {
  const token = process.env.ADMIN_TOKEN;
  return token && token.length >= 12 ? token : null;
}

export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 30;

function sign(token: string, expires: string): string {
  return createHmac("sha256", token).update(`leonida-blue-book-admin:${expires}`).digest("hex");
}

function sessionValue(token: string): string {
  const expires = String(Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS);
  return `${expires}.${sign(token, expires)}`;
}

function validSession(token: string, value: string): boolean {
  const [expires, sig] = value.split(".");
  if (!expires || !sig || !/^\d+$/.test(expires)) return false;
  if (Number(expires) <= Date.now() / 1000) return false;
  return safeEqual(sig, sign(token, expires));
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
  return Boolean(value && validSession(token, value));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Not authorized");
}
