import { getApprovedCarBySlug, getCarDetail } from "@/lib/queries";
import { OG_SIZE, renderOg } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";
import { SOURCE_LABELS, SOURCES } from "@/lib/sources";
import { formatAmount } from "@/lib/stats";

export const alt = `Community-reported GTA 6 car prices on ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getApprovedCarBySlug(slug);
  if (!car) {
    return renderOg({ title: "Car not found", subtitle: "Community-reported GTA 6 car prices" });
  }
  const detail = await getCarDetail(car.id, "30d");
  return renderOg({
    title: car.name,
    subtitle: `${detail.totalReports} ${detail.totalReports === 1 ? "report" : "reports"} in the last 30 days · median in-game cash`,
    stats: SOURCES.map((s) => {
      const st = detail.stats[s];
      return { label: SOURCE_LABELS[s], value: st.enough ? formatAmount(st.median) : "Not enough reports yet" };
    }),
  });
}
