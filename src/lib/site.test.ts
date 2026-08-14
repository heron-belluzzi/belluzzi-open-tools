import { describe, expect, it } from "vitest";
import { belluzziCampaignUrl, preferredLocale } from "./site";

describe("preferredLocale", () => {
  it("uses English when it is the browser's strongest supported preference", () => {
    expect(preferredLocale("es-ES;q=0.9,en-US;q=0.8,pt-BR;q=0.6")).toBe("en");
  });

  it("uses Brazilian Portuguese for Portuguese browsers", () => {
    expect(preferredLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
  });

  it("falls back to Portuguese when no supported language is provided", () => {
    expect(preferredLocale("de-DE,fr;q=0.8")).toBe("pt");
  });
});

describe("belluzziCampaignUrl", () => {
  it("creates an attributed Belluzzi link", () => {
    const url = new URL(belluzziCampaignUrl("en", "qr_footer"));
    expect(url.pathname).toBe("/en");
    expect(url.searchParams.get("utm_source")).toBe("tools_belluzzi");
    expect(url.searchParams.get("utm_medium")).toBe("opensource");
    expect(url.searchParams.get("utm_campaign")).toBe("belluzzi_open_tools");
    expect(url.searchParams.get("utm_content")).toBe("qr_footer");
  });
});
