import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("formats JSON and converts it to YAML without network calls", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/pt/data");

  const networkCalls: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) {
      networkCalls.push(request.url());
    }
  });

  await expect(
    page.getByRole("heading", { name: "Dados estruturados, sem atrito." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Entrada" })
    .fill('{"name":"Belluzzi","active":true}');
  await page.getByRole("button", { name: "Processar localmente" }).click();
  await expect(page.getByLabel("Resultado")).toHaveValue(
    '{\n  "name": "Belluzzi",\n  "active": true\n}',
  );

  await page.getByRole("button", { name: "JSON para YAML" }).click();
  await page.getByRole("button", { name: "Processar localmente" }).click();
  await expect(page.getByLabel("Resultado")).toContainText("name: Belluzzi");
  await page.getByRole("button", { name: "Copiar" }).click();
  await expect(page.getByRole("button", { name: "Copiado" })).toBeVisible();
  expect(networkCalls).toEqual([]);
});

test("converts CSV, previews rows and reports validation errors", async ({
  page,
}) => {
  await page.goto("/en/data");
  await page.getByRole("tab", { name: "CSV" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "name" })).toBeVisible();
  await page.getByRole("button", { name: "Process locally" }).click();
  await expect(page.getByLabel("Result")).toContainText(
    '"name": "Belluzzi Open Tools"',
  );

  await page
    .getByRole("textbox", { name: "Input" })
    .fill("name,role\nBelluzzi");
  await page.getByRole("button", { name: "Process locally" }).click();
  await expect(
    page.getByText("The CSV is invalid or has rows with different column counts."),
  ).toBeVisible();
});

test("supports keyboard tabs, mobile layout and accessibility", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/pt/data");

  const jsonTab = page.getByRole("tab", { name: "JSON" });
  await jsonTab.focus();
  await jsonTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "YAML" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "Processar localmente" }).click();
  await expect(page.getByLabel("Resultado")).toContainText(
    '"project": "Belluzzi Open Tools"',
  );

  const seriousViolations = (await new AxeBuilder({ page }).analyze()).violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }));
  expect(seriousViolations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
