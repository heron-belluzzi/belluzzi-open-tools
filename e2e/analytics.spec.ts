import { expect, test } from "@playwright/test";

test("loads the dedicated Google Analytics property on every page", async ({
  page,
}) => {
  await page.goto("/pt");

  await expect(
    page.locator(
      'script[src="https://www.googletagmanager.com/gtag/js?id=G-FXBBXBLMDJ"]',
    ),
  ).toHaveCount(1);
  await expect(page.getByRole("dialog", { name: /analytics/i })).toHaveCount(0);
});
