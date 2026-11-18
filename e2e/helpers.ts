import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { E2E_ENV } from "../playwright.config";

const runId = Date.now() % 200;
let ipCounter = 0;

/** A fresh browser context that presents as a distinct client IP. */
export async function newVisitor(browser: Browser): Promise<{ context: BrowserContext; page: Page; ip: string }> {
  ipCounter += 1;
  const ip = `10.${runId}.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip } });
  return { context, page: await context.newPage(), ip };
}

export type ReportFields = {
  newCarName?: string;
  carSlug?: string;
  source: "waink" | "fence" | "randy";
  amount: string;
  platform?: "ps5" | "xbox";
  screenshot?: { name: string; mimeType: string; buffer: Buffer };
  honeypot?: string;
};

export async function fillReport(page: Page, r: ReportFields) {
  await page.goto(r.carSlug ? `/submit?car=${r.carSlug}` : "/submit");
  if (r.newCarName) {
    await page.getByTestId("car-combobox").click();
    await page.getByPlaceholder("Search cars").fill(r.newCarName);
    await page.getByRole("option", { name: /Add a new car/ }).click();
    await expect(page.locator('input[name="newCarName"]')).toBeVisible();
  }
  await page.locator(`input[name="source"][value="${r.source}"]`).check();
  await page.getByLabel(/^Amount/).fill(r.amount);
  if (r.platform) await page.locator(`input[name="platform"][value="${r.platform}"]`).check();
  if (r.screenshot) await page.locator('input[name="screenshot"]').setInputFiles(r.screenshot);
  if (r.honeypot) {
    await page.locator('input[name="website"]').evaluate((el, v) => ((el as HTMLInputElement).value = v), r.honeypot);
  }
}

export async function waitForTurnstile(page: Page) {
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", { timeout: 20_000 });
}

export async function submit(page: Page) {
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByTestId("form-success").or(page.getByTestId("form-error"))).toBeVisible({ timeout: 20_000 });
}

export async function report(page: Page, r: ReportFields) {
  await fillReport(page, r);
  await waitForTurnstile(page);
  await submit(page);
}

export async function adminLogin(page: Page) {
  await page.goto("/admin");
  const dashboard = page.getByRole("heading", { name: /Pending cars/ });
  const token = page.getByLabel("Admin token");
  await expect(dashboard.or(token)).toBeVisible();
  if (await token.isVisible()) {
    await token.fill(E2E_ENV.ADMIN_TOKEN);
    await page.getByRole("button", { name: "Sign in" }).click();
  }
  await expect(page.getByRole("heading", { name: /Pending cars/ })).toBeVisible();
}
