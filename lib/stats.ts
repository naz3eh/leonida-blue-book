export const MIN_REPORTS = 3;
export const OUTLIER_MIN_REPORTS = 5;

export type SourceStats =
  | { enough: false; count: number }
  | { enough: true; count: number; median: number; low: number; high: number };

function sortedCopy(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

function quantile(sorted: readonly number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
}

export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error("median of empty list");
  return Math.round(quantile(sortedCopy(values), 0.5));
}

export function removeOutliers(values: readonly number[]): number[] {
  const sorted = sortedCopy(values);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return sorted.filter((v) => v >= lo && v <= hi);
}

export function computeStats(values: readonly number[]): SourceStats {
  const count = values.length;
  if (count < MIN_REPORTS) return { enough: false, count };
  const range = count >= OUTLIER_MIN_REPORTS ? removeOutliers(values) : sortedCopy(values);
  return {
    enough: true,
    count,
    median: median(values),
    low: range[0],
    high: range[range.length - 1],
  };
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatAmount(amount: number): string {
  return usd.format(Math.round(amount));
}
