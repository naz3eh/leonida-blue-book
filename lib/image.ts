import sharp from "sharp";
import { MAX_SCREENSHOT_BYTES } from "./schemas";

const FORMATS = {
  png: { ext: "png", contentType: "image/png" },
  jpeg: { ext: "jpg", contentType: "image/jpeg" },
  webp: { ext: "webp", contentType: "image/webp" },
} as const;

export type CleanImage = { data: Buffer; ext: string; contentType: string };

export class ImageError extends Error {}

export async function cleanScreenshot(input: Buffer): Promise<CleanImage> {
  if (input.byteLength > MAX_SCREENSHOT_BYTES) {
    throw new ImageError("Screenshot must be 2 MB or smaller");
  }
  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new ImageError("Screenshot must be a PNG, JPEG or WebP image");
  }
  if (format !== "png" && format !== "jpeg" && format !== "webp") {
    throw new ImageError("Screenshot must be a PNG, JPEG or WebP image");
  }
  // sharp drops EXIF, XMP, IPTC and ICC metadata unless withMetadata() is called.
  const pipeline = sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });
  let data: Buffer;
  try {
    data =
      format === "png"
        ? await pipeline.png().toBuffer()
        : format === "jpeg"
          ? await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer()
          : await pipeline.webp({ quality: 85 }).toBuffer();
  } catch {
    throw new ImageError("That screenshot couldn't be read. Try another image or send without one");
  }
  return { data, ...FORMATS[format] };
}
