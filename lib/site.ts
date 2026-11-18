export const SITE_NAME = "Leonida Blue Book";
export const SITE_TAGLINE = "Community-reported GTA 6 stolen car prices in in-game cash.";
export const PRICE_NOTE =
  "Prices are reported by players from in-game cash values. Nothing here is official.";
export const FOOTER_NOTE =
  "Unofficial fan project. Not affiliated with Rockstar Games or Take-Two Interactive. In-game cash only.";
export const OG_BADGE = "Community-reported, unofficial";

export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
