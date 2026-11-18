import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { listCarOptions, listLatestReportsForAdmin, listPendingCars } from "@/lib/queries";
import { PLATFORM_LABELS, SOURCE_LABELS } from "@/lib/sources";
import { formatAmount } from "@/lib/stats";
import { relativeTime } from "@/lib/time";
import { approveCar, logout, setReportStatus } from "./actions";
import { LoginForm, MergeForm, RenameForm } from "./forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">Set ADMIN_TOKEN (12 characters or more) to turn on the admin page.</p>
      </div>
    );
  }
  if (!(await isAdmin())) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <LoginForm />
      </div>
    );
  }

  const [pending, reports, approved] = await Promise.all([
    listPendingCars(),
    listLatestReportsForAdmin(100),
    listCarOptions(),
  ]);
  const now = new Date();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin</h1>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>

      <section aria-labelledby="pending-heading" className="space-y-4">
        <h2 id="pending-heading" className="text-xl font-semibold">
          Pending cars ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground">Nothing waiting.</p>
        ) : (
          <ul className="space-y-3" data-testid="pending-cars">
            {pending.map((car) => (
              <li key={car.id} className="space-y-3 rounded-xl border border-border bg-card p-4" data-car-name={car.name}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{car.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {car.reportCount} {car.reportCount === 1 ? "report" : "reports"} · added{" "}
                      {relativeTime(car.createdAt, now)}
                    </p>
                  </div>
                  <form action={approveCar}>
                    <input type="hidden" name="carId" value={car.id} />
                    <Button type="submit" size="sm" aria-label={`Approve ${car.name}`}>
                      Approve
                    </Button>
                  </form>
                </div>
                <div className="flex flex-wrap gap-6">
                  <RenameForm carId={car.id} name={car.name} />
                  <MergeForm carId={car.id} targets={approved} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reports-heading" className="space-y-4">
        <h2 id="reports-heading" className="text-xl font-semibold">
          Latest reports
        </h2>
        {reports.length === 0 ? (
          <p className="text-muted-foreground">No reports yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-card text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Car</th>
                  <th scope="col" className="px-3 py-2 font-medium">Amount</th>
                  <th scope="col" className="px-3 py-2 font-medium">Source</th>
                  <th scope="col" className="px-3 py-2 font-medium">Platform</th>
                  <th scope="col" className="px-3 py-2 font-medium">Shot</th>
                  <th scope="col" className="px-3 py-2 font-medium">IP hash</th>
                  <th scope="col" className="px-3 py-2 font-medium">When</th>
                  <th scope="col" className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <tr key={r.id} className={r.status === "hidden" ? "opacity-70" : undefined}>
                    <td className="px-3 py-2">
                      {r.carStatus === "approved" ? (
                        <Link href={`/cars/${r.carSlug}`} className="text-primary hover:underline">
                          {r.carName}
                        </Link>
                      ) : (
                        <span>
                          {r.carName} <span className="text-muted-foreground">(pending)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{formatAmount(r.amount)}</td>
                    <td className="px-3 py-2">{SOURCE_LABELS[r.source]}</td>
                    <td className="px-3 py-2">{r.platform ? PLATFORM_LABELS[r.platform] : "–"}</td>
                    <td className="px-3 py-2">
                      {r.screenshotUrl ? (
                        <a href={r.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          View
                        </a>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.ipHash.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{relativeTime(r.createdAt, now)}</td>
                    <td className="px-3 py-2">
                      <form action={setReportStatus} className="flex items-center gap-2">
                        <input type="hidden" name="reportId" value={r.id} />
                        <input type="hidden" name="status" value={r.status === "visible" ? "hidden" : "visible"} />
                        <span className={r.status === "hidden" ? "text-destructive" : undefined}>{r.status}</span>
                        <Button type="submit" variant="outline" size="xs">
                          {r.status === "visible" ? "Hide" : "Unhide"}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
