import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceNote } from "@/components/price-note";
import { ReportList } from "@/components/report-list";
import { SourceStatsCard } from "@/components/source-stats";
import { getApprovedCarBySlug, getCarDetail, RANGE_DAYS, type Range } from "@/lib/queries";
import { SITE_NAME } from "@/lib/site";
import { SOURCES } from "@/lib/sources";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
};

function parseRange(value: string | undefined): Range {
  return value === "all" ? "all" : "30d";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const car = await getApprovedCarBySlug(slug);
  if (!car) return { title: "Car not found" };
  const description = `Player-reported in-game cash prices for the ${car.name} in GTA 6: WAINK values, fence payouts and Randy's asks. Community-reported, unofficial.`;
  return {
    title: `${car.name} prices`,
    description,
    alternates: { canonical: `/cars/${car.slug}` },
    openGraph: { title: `${car.name} | ${SITE_NAME}`, description, url: `/cars/${car.slug}` },
    twitter: { card: "summary_large_image", title: `${car.name} | ${SITE_NAME}`, description },
  };
}

export default async function CarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const range = parseRange((await searchParams).range);
  const car = await getApprovedCarBySlug(slug);
  if (!car) notFound();
  const detail = await getCarDetail(car.id, range);

  const tab = (value: Range, label: string) => (
    <Link
      href={value === "all" ? `/cars/${car.slug}?range=all` : `/cars/${car.slug}`}
      aria-current={range === value ? "page" : undefined}
      className={
        range === value
          ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-8">
      <PriceNote />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Cars
            </Link>{" "}
            / {car.name}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{car.name}</h1>
          {car.class ? <p className="text-muted-foreground">{car.class}</p> : null}
        </div>
        <Link
          href={`/submit?car=${car.slug}`}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/85"
        >
          Report a price for this car
        </Link>
      </div>

      <nav aria-label="Time range" className="inline-flex gap-1 rounded-lg border border-border bg-card p-1">
        {tab("30d", `Last ${RANGE_DAYS} days`)}
        {tab("all", "All time")}
      </nav>

      <section aria-labelledby="prices-heading" className="space-y-3">
        <h2 id="prices-heading" className="sr-only">
          Reported prices by source
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SOURCES.map((s) => (
            <SourceStatsCard key={s} source={s} stats={detail.stats[s]} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Medians need at least 3 reports. With 5 or more, low and high leave out outliers.
        </p>
      </section>

      <section aria-labelledby="reports-heading" className="space-y-4">
        <h2 id="reports-heading" className="text-xl font-semibold">
          Recent reports
        </h2>
        {detail.reports.length === 0 ? (
          <p className="text-muted-foreground">
            No reports in this range.{" "}
            {range === "30d" ? (
              <Link href={`/cars/${car.slug}?range=all`} className="text-primary underline underline-offset-4">
                Show all time
              </Link>
            ) : null}
          </p>
        ) : (
          <ReportList reports={detail.reports} />
        )}
      </section>
    </div>
  );
}
