import { describe, expect, it } from "vitest";
import { normalizeCarName, slugify } from "@/lib/normalize";

describe("normalizeCarName", () => {
  it("trims, collapses spaces and title-cases", () => {
    expect(normalizeCarName("   pegassi    zentorno  ")).toBe("Pegassi Zentorno");
  });

  it("lowercases shouting before title-casing", () => {
    expect(normalizeCarName("BRAVADO BANSHEE")).toBe("Bravado Banshee");
  });

  it("handles tabs, newlines and hyphens", () => {
    expect(normalizeCarName("declasse\tvigero-zx\n")).toBe("Declasse Vigero-Zx");
  });

  it("is idempotent", () => {
    const once = normalizeCarName("  obey   9f cabrio ");
    expect(normalizeCarName(once)).toBe(once);
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Pegassi Zentorno")).toBe("pegassi-zentorno");
    expect(slugify("Übermacht Sentinel XS!")).toBe("ubermacht-sentinel-xs");
    expect(slugify("***")).toBe("car");
  });
});
