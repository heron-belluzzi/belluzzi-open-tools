import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("UTM alias negotiates the browser language and preserves the query", async ({
  request,
}) => {
  const english = await request.get("/?source=github", {
    headers: {
      host: "utm.belluzzi.dev",
      "accept-language": "en-US,en;q=0.9,pt-BR;q=0.7",
    },
    maxRedirects: 0,
  });
  expect(english.status()).toBe(307);
  expect(english.headers().location).toBe(
    "https://tools.belluzzi.dev/en/utm?source=github",
  );
  expect(english.headers().vary).toContain("Accept-Language");

  const portuguese = await request.get("/", {
    headers: {
      host: "utm.belluzzi.dev",
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    maxRedirects: 0,
  });
  expect(portuguese.status()).toBe(307);
  expect(portuguese.headers().location).toBe(
    "https://tools.belluzzi.dev/pt/utm",
  );
});

test("builds, normalizes and copies a UTM link locally", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/pt/utm");
  const output = page.getByLabel("Link gerado");

  const networkCalls: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) {
      networkCalls.push(request.url());
    }
  });

  await page.getByLabel("URL de destino").fill(
    "belluzzi.dev/servicos?ref=partner#contato",
  );
  await page.getByRole("button", { name: "Google Ads" }).click();
  await page.getByLabel("Campanha · utm_campaign").fill("Lançamento Agosto");
  await page.getByLabel("Conteúdo · utm_content (opcional)").fill(
    "Botão Principal",
  );

  await expect(output).toHaveText(
    "https://belluzzi.dev/servicos?ref=partner&utm_source=google&utm_medium=cpc&utm_campaign=lancamento_agosto&utm_content=botao_principal#contato",
  );
  await page.getByRole("button", { name: "Copiar" }).click();
  await expect(page.getByRole("button", { name: "Copiado" })).toBeVisible();
  expect(networkCalls).toEqual([]);
});

test("builds a WhatsApp link and hands it to QR Studio once", async ({
  page,
}) => {
  await page.goto("/pt/utm");
  await page.getByRole("tab", { name: "Link do WhatsApp" }).click();
  await page.getByLabel("Telefone com DDI e DDD").fill("+55 (35) 99999-0000");
  await page
    .getByLabel("Mensagem inicial")
    .fill("Olá! 👋\nQuero conhecer o projeto.");

  const expected =
    "https://wa.me/5535999990000?text=Ol%C3%A1!%20%F0%9F%91%8B%0AQuero%20conhecer%20o%20projeto.";
  await expect(page.getByLabel("Link gerado")).toHaveText(expected);
  await expect(
    page
      .getByRole("paragraph")
      .filter({ hasText: "Quero conhecer o projeto." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Gerar QR" }).click();
  await expect(page).toHaveURL(/\/pt\/qr$/);
  await expect(page.getByRole("tab", { name: "Link" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("Endereço do link")).toHaveValue(expected);
  await expect(page.getByAltText("QR Code pronto")).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("belluzzi-open-tools:qr-handoff:v1"),
    ),
  ).toBeNull();
});

test("supports keyboard tabs and English localization", async ({ page }) => {
  await page.goto("/en/utm");
  await expect(
    page.getByRole("heading", { name: "Links ready to measure and share." }),
  ).toBeVisible();

  const utmTab = page.getByRole("tab", { name: "UTM campaign" });
  await utmTab.focus();
  await utmTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "WhatsApp link" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "WhatsApp link" }).press("Home");
  await expect(page.getByRole("tab", { name: "UTM campaign" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("has no serious accessibility violations or mobile overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/pt/utm");
  await page.getByRole("button", { name: "Meta Ads" }).click();
  await page.getByLabel("Campanha · utm_campaign").fill("mobile");
  await expect(page.getByLabel("Link gerado")).toContainText("utm_source=meta");

  const seriousViolations = (await new AxeBuilder({ page }).analyze()).violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }));
  expect(seriousViolations).toEqual([]);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
