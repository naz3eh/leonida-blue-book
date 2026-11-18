import Image from "next/image";
import Link from "next/link";
import type { PublicReport } from "@/lib/queries";
import { PLATFORM_LABELS, SOURCE_LABELS } from "@/lib/sources";
import { formatAmount } from "@/lib/stats";
import { relativeTime } from "@/lib/time";

export function ReportList({ reports, showCar }: { reports: PublicReport[]; showCar?: boolean }) {
  const now = new Date();
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card" data-testid="report-list">
      {reports.map((r) => (
        <li key={r.id} className="flex items-center gap-4 px-4 py-3">
          {r.screenshotUrl ? (
            <a href={r.screenshotUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Image
                src={r.screenshotUrl}
                alt={`Screenshot for a ${formatAmount(r.amount)} ${SOURCE_LABELS[r.source]} report`}
                width={64}
                height={40}
                className="h-10 w-16 rounded-md border border-border object-cover"
              />
            </a>
          ) : (
            <span aria-hidden className="h-10 w-16 shrink-0 rounded-md border border-dashed border-border" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium tabular-nums">
              {formatAmount(r.amount)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {SOURCE_LABELS[r.source]}
                {r.platform ? ` · ${PLATFORM_LABELS[r.platform]}` : ""}
              </span>
            </p>
            {showCar ? (
              <Link href={`/cars/${r.carSlug}`} className="text-sm text-primary hover:underline">
                {r.carName}
              </Link>
            ) : null}
          </div>
          <time dateTime={r.createdAt.toISOString()} className="shrink-0 text-sm text-muted-foreground">
            {relativeTime(r.createdAt, now)}
          </time>
        </li>
      ))}
    </ul>
  );
}
