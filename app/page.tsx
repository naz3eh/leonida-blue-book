import Link from "next/link";
import { CarSearch, type CarRow } from "@/components/car-search";
import { PriceNote } from "@/components/price-note";
import { ReportList } from "@/components/report-list";
import { listApprovedCars, recentReports } from "@/lib/queries";
import { formatAmount } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cars, recent] = await Promise.all([listApprovedCars(), recentReports(20)]);
  const rows: CarRow[] = cars.map((c) => ({
    slug: c.slug,
    name: c.name,
    class: c.class,
    reportCount: c.reportCount,
    median: c.stats.enough ? formatAmount(c.stats.median) : null,
  }));

  return (
    <div className="space-y-10">
      <PriceNote />
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What are stolen cars going for in Leonida?
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Players report what they saw in GTA 6: the WAINK scanner value, what a fence paid, or what
          Randy asked for. We show the median and range per car, in in-game cash.
        </p>
      </section>

      {rows.length === 0 ? (
        <section
          className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"
          data-testid="empty-state"
        >
          <h2 className="text-xl font-semibold">No cars yet</h2>
          <p className="mt-2 text-muted-foreground">
            Nobody has reported a price so far. Be the first.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/85"
          >
            Report a price
          </Link>
        </section>
      ) : (
        <section aria-labelledby="cars-heading" className="space-y-4">
          <h2 id="cars-heading" className="text-xl font-semibold">
            Cars
          </h2>
          <CarSearch cars={rows} />
        </section>
      )}

      <section aria-labelledby="recent-heading" className="space-y-4">
        <h2 id="recent-heading" className="text-xl font-semibold">
          Recent reports
        </h2>
        {recent.length === 0 ? (
          <p className="text-muted-foreground">No reports yet.</p>
        ) : (
          <ReportList reports={recent} showCar />
        )}
      </section>
    </div>
  );
}
