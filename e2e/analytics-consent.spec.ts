import { expect, test } from "@playwright/test";

const consentKey = "belluzzi:analytics-consent:v1";
const measurementId = "G-FXBBXBLMDJ";

test.beforeEach(async ({ page }) => {
  await page.goto("/pt");
  await page.evaluate((key) => window.localStorage.removeItem(key), consentKey);
  await page.reload();
});

test("loads Google Analytics only after explicit consent", async ({ page }) => {
  const tagRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("googletagmanager.com/gtag/js")) {
      tagRequests.push(request.url());
    }
  });

  await expect(
    page.getByRole("dialog", { name: "Preferências de analytics" }),
  ).toBeVisible();
  await expect(
    page.locator('script[src*="googletagmanager.com/gtag/js"]'),
  ).toHaveCount(0);
  expect(tagRequests).toEqual([]);

  await page.getByRole("button", { name: "Aceitar analytics" }).click();

  await expect
    .poll(() => tagRequests.some((url) => url.includes(`id=${measurementId}`)))
    .toBe(true);
  await expect(
    page.locator(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`),
  ).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Preferências de analytics" })).toBeVisible();
});

test("persists rejection and removes the tag after consent is revoked", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Recusar" }).click();
  await page.reload();

  await expect(
    page.locator('script[src*="googletagmanager.com/gtag/js"]'),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), consentKey))
    .toBe("denied");

  await page.getByRole("button", { name: "Preferências de analytics" }).click();
  await page.getByRole("button", { name: "Aceitar analytics" }).click();
  await expect(
    page.locator(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Preferências de analytics" }).click();
  await page.getByRole("button", { name: "Recusar" }).click();
  await page.waitForLoadState("domcontentloaded");

  await expect(
    page.locator('script[src*="googletagmanager.com/gtag/js"]'),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), consentKey))
    .toBe("denied");
});
