import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { adminLogin, fillReport, newVisitor, report, submit, waitForTurnstile } from "./helpers";

const CAR = "Test Coupe Alpha";
const SLUG = "test-coupe-alpha";

test.describe.serial("Leonida Blue Book", () => {
  test("empty database shows an empty state linking to /submit", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("price-note")).toHaveText(
      "Prices are reported by players from in-game cash values. Nothing here is official.",
    );
    const empty = page.getByTestId("empty-state");
    await expect(empty).toBeVisible();
    await expect(empty.getByRole("link", { name: "Report a price" })).toHaveAttribute("href", "/submit");
    await expect(page.getByRole("contentinfo")).toHaveText(
      "Unofficial fan project. Not affiliated with Rockstar Games or Take-Two Interactive. In-game cash only.",
    );
  });

  test("a new car stays pending until approved in admin", async ({ browser, page }) => {
    const v = await newVisitor(browser);
    await report(v.page, { newCarName: "  test   coupe ALPHA ", source: "fence", amount: "9000", platform: "ps5" });
    await expect(v.page.getByTestId("form-success")).toContainText("after a moderator approves");
    await v.context.close();

    await page.goto("/");
    await expect(page.getByTestId("empty-state")).toBeVisible();
    expect((await page.goto(`/cars/${SLUG}`))?.status()).toBe(404);

    await adminLogin(page);
    const pending = page.locator(`[data-car-name="${CAR}"]`);
    await expect(pending).toContainText("1 report");
    await pending.getByRole("button", { name: `Approve ${CAR}` }).click();
    await expect(pending).toHaveCount(0);

    await page.goto("/");
    await expect(page.getByTestId("car-list")).toContainText(CAR);
  });

  test("three reports give the right median and OG image", async ({ browser, page }) => {
    for (const amount of ["15,000", "10000", "12000"]) {
      const v = await newVisitor(browser);
      await report(v.page, { carSlug: SLUG, source: "waink", amount });
      await expect(v.page.getByTestId("form-success")).toBeVisible();
      await v.context.close();
    }
    await page.goto(`/cars/${SLUG}`);
    await expect(page.getByTestId("median-waink")).toHaveText("$12,000");
    await expect(page.getByTestId("stats-waink")).toContainText("$10,000");
    await expect(page.getByTestId("stats-waink")).toContainText("$15,000");
    await expect(page.getByTestId("not-enough-fence")).toBeVisible();
    await expect(page.getByTestId("stats-fence")).toContainText("1 of 3 reports needed");
    await expect(page.getByTestId("not-enough-randy")).toBeVisible();

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const ogUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogUrl).toContain(`/cars/${SLUG}/opengraph-image`);
    const res = await page.request.get(ogUrl!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const meta = await sharp(await res.body()).metadata();
    expect([meta.width, meta.height]).toEqual([1200, 630]);

    await page.goto("/");
    await expect(page.getByTestId("car-list")).toContainText("$11,000");
  });

  test("a duplicate within 24 hours is rejected", async ({ browser }) => {
    const v = await newVisitor(browser);
    await report(v.page, { carSlug: SLUG, source: "randy", amount: "20000" });
    await expect(v.page.getByTestId("form-success")).toBeVisible();
    await report(v.page, { carSlug: SLUG, source: "randy", amount: "21000" });
    await expect(v.page.getByTestId("form-error")).toContainText("already reported this car and source in the last 24 hours");
    await v.context.close();
  });

  test("the sixth report from one IP within an hour is rejected", async ({ browser }) => {
    const v = await newVisitor(browser);
    for (let i = 1; i <= 5; i++) {
      await report(v.page, { newCarName: `Rate Limit Car ${i}`, source: "waink", amount: String(1000 * i) });
      await expect(v.page.getByTestId("form-success")).toBeVisible();
    }
    await report(v.page, { newCarName: "Rate Limit Car 6", source: "waink", amount: "6000" });
    await expect(v.page.getByTestId("form-error")).toContainText("5 reports in the last hour");
    await v.context.close();
  });

  test("missing Turnstile token and filled honeypot are rejected on the server", async ({ browser }) => {
    const v = await newVisitor(browser);
    await v.page.route("https://challenges.cloudflare.com/**", (r) => r.abort());
    await fillReport(v.page, { carSlug: SLUG, source: "fence", amount: "5000" });
    await submit(v.page);
    await expect(v.page.getByTestId("form-error")).toContainText("spam check failed");
    await v.page.unroute("https://challenges.cloudflare.com/**");

    await fillReport(v.page, { carSlug: SLUG, source: "fence", amount: "5000", honeypot: "https://spam.example" });
    await waitForTurnstile(v.page);
    await submit(v.page);
    await expect(v.page.getByTestId("form-error")).toContainText("could not be accepted");
    await v.context.close();
  });

  test("screenshots: too big is rejected, accepted ones have no EXIF", async ({ browser }) => {
    const v = await newVisitor(browser);
    await fillReport(v.page, {
      carSlug: SLUG,
      source: "fence",
      amount: "8000",
      screenshot: { name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 10) },
    });
    await v.page.getByRole("button", { name: "Send report" }).click();
    await expect(v.page.getByTestId("form-error")).toContainText("2 MB or smaller");

    const jpeg = await sharp({ create: { width: 320, height: 180, channels: 3, background: "#334" } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "gps-secret", Artist: "player" } } })
      .toBuffer();
    expect((await sharp(jpeg).metadata()).exif).toBeDefined();
    await report(v.page, {
      carSlug: SLUG,
      source: "fence",
      amount: "8000",
      screenshot: { name: "shot.jpg", mimeType: "image/jpeg", buffer: jpeg },
    });
    await expect(v.page.getByTestId("form-success")).toBeVisible();

    await v.page.goto(`/cars/${SLUG}`);
    const src = await v.page.getByTestId("report-list").locator("img").first().getAttribute("src");
    const res = await v.page.request.get(src!);
    expect(res.status()).toBe(200);
    const body = await res.body();
    expect((await sharp(body).metadata()).exif).toBeUndefined();
    expect(body.includes(Buffer.from("gps-secret"))).toBe(false);
    await v.context.close();
  });

  test("a GIF is rejected by the server", async ({ browser }) => {
    const v = await newVisitor(browser);
    const gif = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#000" } }).gif().toBuffer();
    await report(v.page, {
      carSlug: SLUG,
      source: "randy",
      amount: "8000",
      screenshot: { name: "a.gif", mimeType: "image/gif", buffer: gif },
    });
    await expect(v.page.getByTestId("form-error")).toBeVisible();
    await expect(v.page.getByText("Screenshot must be a PNG, JPEG or WebP image")).toBeVisible();
    await v.context.close();
  });

  test("hidden reports drop out of stats and public lists", async ({ page }) => {
    await adminLogin(page);
    const row = page.locator("tr", { hasText: "$15,000" });
    await row.getByRole("button", { name: "Hide" }).click();
    await expect(page.locator("tr", { hasText: "$15,000" }).getByRole("button", { name: "Unhide" })).toBeVisible();

    await page.goto(`/cars/${SLUG}`);
    await expect(page.getByTestId("not-enough-waink")).toBeVisible();
    await expect(page.getByTestId("stats-waink")).toContainText("2 of 3 reports needed");
    await expect(page.getByTestId("report-list")).not.toContainText("$15,000");
    await page.goto("/");
    await expect(page.getByTestId("report-list")).not.toContainText("$15,000");

    await adminLogin(page);
    await page.locator("tr", { hasText: "$15,000" }).getByRole("button", { name: "Unhide" }).click();
    await page.goto(`/cars/${SLUG}`);
    await expect(page.getByTestId("median-waink")).toHaveText("$12,000");
  });
});
