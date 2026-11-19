import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import type { CleanImage } from "./image";

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".local-uploads");

export function localUploadsEnabled(): boolean {
  return !process.env.BLOB_READ_WRITE_TOKEN && process.env.LOCAL_UPLOADS === "1";
}

export function uploadsEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || localUploadsEnabled();
}

export async function storeScreenshot(image: CleanImage): Promise<string> {
  const name = `${randomUUID()}.${image.ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`screenshots/${name}`, image.data, {
      access: "public",
      contentType: image.contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  if (localUploadsEnabled()) {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_UPLOAD_DIR, name), image.data);
    return `/uploads/${name}`;
  }
  throw new Error("Screenshot storage is not configured");
}
