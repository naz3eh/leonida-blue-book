import { describe, expect, it } from "vitest";
import { carNameSchema, formDataToReportInput, reportSchema } from "@/lib/schemas";

function fd(entries: Record<string, string | File>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return formDataToReportInput(f);
}

const base = { carId: "3", source: "waink", amount: "12500", "cf-turnstile-response": "tok" };

describe("reportSchema", () => {
  it("accepts a valid report for an existing car", () => {
    const r = reportSchema.safeParse(fd(base));
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ carId: 3, source: "waink", amount: 12500, turnstileToken: "tok" });
    expect(r.data?.platform).toBeUndefined();
    expect(r.data?.screenshot).toBeUndefined();
  });

  it("accepts a new car and normalizes its name", () => {
    const r = reportSchema.safeParse(fd({ ...base, carId: "", newCarName: "  grotti   cheetah " }));
    expect(r.success).toBe(true);
    expect(r.data?.newCarName).toBe("Grotti Cheetah");
  });

  it("strips $ and commas from the amount", () => {
    expect(reportSchema.safeParse(fd({ ...base, amount: "$12,500" })).data?.amount).toBe(12500);
  });

  it.each(["0", "-5", "10000001", "12.5", "abc", ""])("rejects amount %s", (amount) => {
    const r = reportSchema.safeParse(fd({ ...base, amount }));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path[0]).toBe("amount");
  });

  it("accepts the amount bounds", () => {
    expect(reportSchema.safeParse(fd({ ...base, amount: "1" })).success).toBe(true);
    expect(reportSchema.safeParse(fd({ ...base, amount: "10000000" })).success).toBe(true);
  });

  it("requires a car", () => {
    const r = reportSchema.safeParse(fd({ ...base, carId: "" }));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path[0]).toBe("carId");
  });

  it("rejects unknown sources and platforms", () => {
    expect(reportSchema.safeParse(fd({ ...base, source: "ebay" })).success).toBe(false);
    expect(reportSchema.safeParse(fd({ ...base, platform: "pc" })).success).toBe(false);
    expect(reportSchema.safeParse(fd({ ...base, platform: "xbox" })).data?.platform).toBe("xbox");
  });

  it("passes the honeypot through so the server can reject it", () => {
    expect(reportSchema.safeParse(fd({ ...base, website: "http://spam" })).data?.website).toBe("http://spam");
  });

  it("rejects screenshots over 2 MB", () => {
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "a.png", { type: "image/png" });
    const r = reportSchema.safeParse(fd({ ...base, screenshot: big }));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/2 MB/);
  });

  it("rejects other file types", () => {
    const gif = new File([new Uint8Array(10)], "a.gif", { type: "image/gif" });
    expect(reportSchema.safeParse(fd({ ...base, screenshot: gif })).success).toBe(false);
  });

  it("ignores an empty file input", () => {
    const empty = new File([], "", { type: "application/octet-stream" });
    expect(reportSchema.safeParse(fd({ ...base, screenshot: empty })).success).toBe(true);
  });
});

describe("carNameSchema", () => {
  it("rejects too short and odd names", () => {
    expect(carNameSchema.safeParse(" a ").success).toBe(false);
    expect(carNameSchema.safeParse("<script>").success).toBe(false);
    expect(carNameSchema.safeParse("x".repeat(61)).success).toBe(false);
  });
});
