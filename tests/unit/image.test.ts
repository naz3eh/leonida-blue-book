import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { cleanScreenshot, ImageError } from "@/lib/image";

async function jpegWithExif() {
  return sharp({ create: { width: 64, height: 48, channels: 3, background: "#ff4f8b" } })
    .jpeg()
    .withMetadata({ exif: { IFD0: { Copyright: "secret", Artist: "someone" } } })
    .toBuffer();
}

describe("cleanScreenshot", () => {
  it("removes EXIF from JPEGs", async () => {
    const input = await jpegWithExif();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const out = await cleanScreenshot(input);
    expect(out.contentType).toBe("image/jpeg");
    const meta = await sharp(out.data).metadata();
    expect(meta.exif).toBeUndefined();
    expect(out.data.includes(Buffer.from("secret"))).toBe(false);
  });

  it("removes EXIF from PNG and WebP", async () => {
    for (const fmt of ["png", "webp"] as const) {
      const input = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } })
        .toFormat(fmt)
        .withMetadata({ exif: { IFD0: { Copyright: "secret" } } })
        .toBuffer();
      const out = await cleanScreenshot(input);
      expect((await sharp(out.data).metadata()).exif).toBeUndefined();
    }
  });

  it("rejects non-image data and other formats", async () => {
    await expect(cleanScreenshot(Buffer.from("not an image"))).rejects.toBeInstanceOf(ImageError);
    const gif = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#000" } }).gif().toBuffer();
    await expect(cleanScreenshot(gif)).rejects.toThrow(/PNG, JPEG or WebP/);
  });

  it("rejects files over 2 MB", async () => {
    await expect(cleanScreenshot(Buffer.alloc(2 * 1024 * 1024 + 1))).rejects.toThrow(/2 MB/);
  });
});
