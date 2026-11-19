"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export type CarRow = {
  slug: string;
  name: string;
  class: string | null;
  reportCount: number;
  median: string | null;
};

export function CarSearch({ cars }: { cars: CarRow[] }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? cars.filter((c) => c.name.toLowerCase().includes(q)) : cars;
  }, [cars, query]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          Search cars
        </label>
        <Input
          id={inputId}
          type="search"
          placeholder="Type a car name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground" role="status">
          No cars match &ldquo;{query}&rdquo;.{" "}
          <Link href="/submit" className="text-primary underline underline-offset-4">
            Add it with a report
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card" data-testid="car-list">
          {filtered.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/cars/${c.slug}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-accent/60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.name}</span>
                  {c.class ? <span className="text-sm text-muted-foreground">{c.class}</span> : null}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums">
                    {c.median ?? <span className="text-sm font-normal text-muted-foreground">Not enough reports yet</span>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {c.reportCount} {c.reportCount === 1 ? "report" : "reports"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
