import { ImageResponse } from "next/og";
import { OG_BADGE, SITE_NAME } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };

const BG = "#0b0d10";
const FG = "#eef0f3";
const MUTED = "#a3aab5";
const ACCENT = "#ff4f8b";

export type OgStat = { label: string; value: string };

export function renderOg({
  title,
  subtitle,
  stats,
}: {
  title: string;
  subtitle: string;
  stats?: OgStat[];
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          color: FG,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: MUTED }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: ACCENT }} />
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: title.length > 24 ? 64 : 84, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 32, color: MUTED }}>{subtitle}</div>
        </div>
        {stats && stats.length > 0 ? (
          <div style={{ display: "flex", gap: 24 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  border: "2px solid #2a2f38",
                  borderRadius: 18,
                  padding: "20px 24px",
                  background: "#13161b",
                }}
              >
                <div style={{ fontSize: 26, color: MUTED }}>{s.label}</div>
                <div
                  style={{
                    fontSize: s.value.startsWith("$") ? 48 : 30,
                    fontWeight: 700,
                    color: s.value.startsWith("$") ? ACCENT : FG,
                    marginTop: 8,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
        <div style={{ display: "flex", fontSize: 26, color: ACCENT }}>{OG_BADGE}</div>
      </div>
    ),
    {
      ...OG_SIZE,
      // Prices change as reports come in, so don't let caches keep an image for long.
      headers: { "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600" },
    },
  );
}
