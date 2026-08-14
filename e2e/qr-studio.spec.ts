import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("QR alias negotiates the browser language and preserves the query", async ({
  request,
}) => {
  const english = await request.get("/?campaign=launch", {
    headers: {
      host: "qr.belluzzi.dev",
      "accept-language": "en-US,en;q=0.9,pt-BR;q=0.7",
    },
    maxRedirects: 0,
  });
  expect(english.status()).toBe(307);
  expect(english.headers().location).toBe(
    "https://tools.belluzzi.dev/en/qr?campaign=launch",
  );
  expect(english.headers().vary).toContain("Accept-Language");

  const portuguese = await request.get("/", {
    headers: {
      host: "qr.belluzzi.dev",
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    maxRedirects: 0,
  });
  expect(portuguese.status()).toBe(307);
  expect(portuguese.headers().location).toBe(
    "https://tools.belluzzi.dev/pt/qr",
  );

  const pageResponse = await request.get("/pt/qr");
  expect(pageResponse.headers()["content-security-policy"]).toContain(
    "default-src 'self'",
  );
});

test("creates an event QR code and applies a local logo", async ({ page }) => {
  await page.goto("/pt/qr");
  await expect(
    page.getByRole("heading", { name: "Um QR Code pronto para usar." }),
  ).toBeVisible();
  await expect(page.getByAltText("QR Code pronto")).toBeVisible();

  await page.getByRole("tab", { name: "Evento" }).click();
  await page.getByLabel("Título do evento").fill("Lançamento Belluzzi");
  await page.getByLabel("Início").fill("2026-08-20T09:30");
  await page.getByLabel("Término").fill("2026-08-20T10:30");
  await page.getByLabel("Local").fill("Escritório Belluzzi");
  await expect(page.getByAltText("QR Code pronto")).toBeVisible();

  await page.getByLabel("Escolher imagem").setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await expect(page.getByText("logo.png")).toBeVisible();
  await expect(page.getByLabel("Correção de erro")).toBeDisabled();
  await expect(page.getByLabel("Correção de erro")).toHaveValue("H");
  await expect(page.getByAltText("QR Code pronto")).toBeVisible();
});

test("warns about low contrast", async ({ page }) => {
  await page.goto("/pt/qr");
  await page.getByLabel("Cor do QR Code").fill("#777777");
  await page.getByLabel("Cor de fundo").fill("#888888");
  await expect(page.getByText(/Contraste baixo/)).toBeVisible();
});

test("content tabs support arrow-key navigation", async ({ page }) => {
  await page.goto("/pt/qr");
  const linkTab = page.getByRole("tab", { name: "Link" });
  await linkTab.focus();
  await linkTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Texto" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "Texto" }).press("End");
  await expect(page.getByRole("tab", { name: "E-mail" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("has no serious accessibility violations or mobile overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/pt/qr");
  await expect(page.getByAltText("QR Code pronto")).toBeVisible();

  const seriousViolations = (await new AxeBuilder({ page }).analyze()).violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }));
  expect(seriousViolations).toEqual([]);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
