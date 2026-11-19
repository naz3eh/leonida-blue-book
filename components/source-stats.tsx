import type { Source } from "@/db/schema";
import { SOURCE_DESCRIPTIONS, SOURCE_LABELS } from "@/lib/sources";
import { formatAmount, MIN_REPORTS, type SourceStats } from "@/lib/stats";

export function SourceStatsCard({ source, stats }: { source: Source; stats: SourceStats }) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby={`stat-${source}`}
      data-testid={`stats-${source}`}
    >
      <h3 id={`stat-${source}`} className="font-semibold">
        {SOURCE_LABELS[source]}
      </h3>
      <p className="text-sm text-muted-foreground">{SOURCE_DESCRIPTIONS[source]}</p>
      {stats.enough ? (
        <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
          <div className="col-span-3 flex flex-col-reverse">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Median</dt>
            <dd className="text-3xl font-bold tabular-nums text-primary" data-testid={`median-${source}`}>
              {formatAmount(stats.median)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Low</dt>
            <dd className="tabular-nums">{formatAmount(stats.low)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">High</dt>
            <dd className="tabular-nums">{formatAmount(stats.high)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Reports</dt>
            <dd className="tabular-nums">{stats.count}</dd>
          </div>
        </dl>
      ) : (
        <div className="mt-4">
          <p className="font-medium" data-testid={`not-enough-${source}`}>
            Not enough reports yet
          </p>
          <p className="text-sm text-muted-foreground">
            {stats.count} of {MIN_REPORTS} reports needed
          </p>
        </div>
      )}
    </section>
  );
}
