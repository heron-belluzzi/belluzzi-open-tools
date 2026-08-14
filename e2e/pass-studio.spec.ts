import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Pass alias negotiates the browser language and preserves the query", async ({
  request,
}) => {
  const english = await request.get("/?source=github", {
    headers: {
      host: "pass.belluzzi.dev",
      "accept-language": "en-US,en;q=0.9,pt-BR;q=0.7",
    },
    maxRedirects: 0,
  });
  expect(english.status()).toBe(307);
  expect(english.headers().location).toBe(
    "https://tools.belluzzi.dev/en/pass?source=github",
  );
  expect(english.headers().vary).toContain("Accept-Language");

  const portuguese = await request.get("/", {
    headers: {
      host: "pass.belluzzi.dev",
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    maxRedirects: 0,
  });
  expect(portuguese.status()).toBe(307);
  expect(portuguese.headers().location).toBe(
    "https://tools.belluzzi.dev/pt/pass",
  );
});

test("generates passwords locally with the selected rules", async ({ page }) => {
  await page.goto("/pt/pass");
  const output = page.getByLabel("Resultado");
  await expect(output).not.toContainText("Gerando com segurança");
  await expect(output).toHaveText(/.{20}/);

  const networkCalls: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) {
      networkCalls.push(request.url());
    }
  });

  await page.getByLabel("Quantidade de caracteres").fill("32");
  await page.getByRole("button", { name: "Gerar nova" }).click();
  const value = await output.textContent();
  expect(value).toHaveLength(32);
  expect(value).toMatch(/[a-z]/);
  expect(value).toMatch(/[A-Z]/);
  expect(value).toMatch(/[0-9]/);
  expect(
    [...(value ?? "")].some((character) =>
      "!@#$%^&*()-_=+[]{};:,.?".includes(character),
    ),
  ).toBe(true);
  expect(networkCalls).toEqual([]);
});

test("generates a six-word passphrase and exposes its estimate", async ({
  page,
}) => {
  await page.goto("/pt/pass");
  await page.getByRole("tab", { name: "Passphrase" }).click();
  const output = page.getByLabel("Resultado");
  await expect(output).not.toContainText("Gerando com segurança");
  expect((await output.textContent())?.split("-")).toHaveLength(6);
  await expect(page.getByText("66 bits estimados")).toBeVisible();
});

test("supports keyboard tabs, clipboard feedback and the English page", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/pass");
  await expect(
    page.getByRole("heading", { name: "A strong password. Yours alone." }),
  ).toBeVisible();

  const passwordTab = page.getByRole("tab", { name: "Random password" });
  await passwordTab.focus();
  await passwordTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Passphrase" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
});

test("has no serious accessibility violations or mobile overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/pt/pass");
  await expect(page.getByLabel("Resultado")).not.toContainText(
    "Gerando com segurança",
  );

  const seriousViolations = (await new AxeBuilder({ page }).analyze()).violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }));
  expect(seriousViolations).toEqual([]);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
