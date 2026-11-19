import { OG_SIZE, renderOg } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME}: community-reported GTA 6 car prices`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    title: "What are stolen cars going for in Leonida?",
    subtitle: "Player-reported WAINK values, fence payouts and Randy's asks, in in-game cash.",
  });
}
