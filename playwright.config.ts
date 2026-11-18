import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
export const BASE_URL = `http://localhost:${PORT}`;

// Cloudflare's official always-pass Turnstile test keys.
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

export const E2E_ENV = {
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/lbb_test",
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
  TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET,
  IP_HASH_SALT: "e2e-salt",
  ADMIN_TOKEN: "e2e-admin-token-0123456789",
  LOCAL_UPLOADS: "1",
  BLOB_READ_WRITE_TOKEN: "",
  UPSTASH_REDIS_REST_URL: process.env.E2E_UPSTASH_REDIS_REST_URL ?? "",
  UPSTASH_REDIS_REST_TOKEN: process.env.E2E_UPSTASH_REDIS_REST_TOKEN ?? "",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    colorScheme: "dark",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `${BASE_URL}/icon.svg`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: { ...E2E_ENV, PORT: String(PORT) },
  },
});
