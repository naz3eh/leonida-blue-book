import type { Platform, Source } from "@/db/schema";

export const SOURCES: readonly Source[] = ["waink", "fence", "randy"];
export const PLATFORMS: readonly Platform[] = ["ps5", "xbox"];

export const SOURCE_LABELS: Record<Source, string> = {
  waink: "WAINK",
  fence: "Fence",
  randy: "Randy",
};

export const SOURCE_DESCRIPTIONS: Record<Source, string> = {
  waink: "Value shown in the WAINK car-scanner app",
  fence: "What a fence paid",
  randy: "What Randy asked for",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  ps5: "PS5",
  xbox: "Xbox Series X|S",
};
