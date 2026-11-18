import { describe, expect, it } from "vitest";
import { computeStats, formatAmount, median, removeOutliers } from "@/lib/stats";

describe("computeStats", () => {
  it("0 reports: not enough", () => {
    expect(computeStats([])).toEqual({ enough: false, count: 0 });
  });

  it("1 report: not enough, keeps the count", () => {
    expect(computeStats([12_500])).toEqual({ enough: false, count: 1 });
  });

  it("2 reports: still not enough", () => {
    expect(computeStats([1, 2])).toEqual({ enough: false, count: 2 });
  });

  it("3 reports: median with plain min and max", () => {
    expect(computeStats([15_000, 10_000, 12_000])).toEqual({
      enough: true,
      count: 3,
      median: 12_000,
      low: 10_000,
      high: 15_000,
    });
  });

  it("4 reports: median averages the middle two, no outlier removal", () => {
    expect(computeStats([10_000, 12_000, 14_000, 1_000_000])).toEqual({
      enough: true,
      count: 4,
      median: 13_000,
      low: 10_000,
      high: 1_000_000,
    });
  });

  it("5 reports: drops an outlier from low and high", () => {
    expect(computeStats([10_000, 11_000, 12_000, 13_000, 500_000])).toEqual({
      enough: true,
      count: 5,
      median: 12_000,
      low: 10_000,
      high: 13_000,
    });
  });

  it("5 reports without outliers keeps the full range", () => {
    expect(computeStats([10_000, 11_000, 12_000, 13_000, 14_000])).toMatchObject({
      low: 10_000,
      high: 14_000,
    });
  });

  it("10 reports with low and high outliers", () => {
    const values = [20_000, 21_000, 22_000, 22_500, 23_000, 23_500, 24_000, 25_000, 1, 9_000_000];
    expect(computeStats(values)).toEqual({
      enough: true,
      count: 10,
      median: 22_750,
      low: 20_000,
      high: 25_000,
    });
  });

  it("counts every report even when outliers are removed from the range", () => {
    const s = computeStats([5, 100, 100, 100, 100, 100, 100]);
    expect(s).toMatchObject({ count: 7, median: 100, low: 100, high: 100 });
  });
});

describe("helpers", () => {
  it("median rounds to whole dollars", () => {
    expect(median([1, 2])).toBe(2);
    expect(median([3, 1, 2])).toBe(2);
  });

  it("removeOutliers uses 1.5x IQR", () => {
    expect(removeOutliers([1, 2, 3, 4, 100])).toEqual([1, 2, 3, 4]);
  });

  it("formats amounts like $12,500", () => {
    expect(formatAmount(12_500)).toBe("$12,500");
    expect(formatAmount(10_000_000)).toBe("$10,000,000");
    expect(formatAmount(1)).toBe("$1");
  });
});
