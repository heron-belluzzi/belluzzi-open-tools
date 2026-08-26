import { describe, expect, it } from "vitest";
import {
  buildCampaignUrl,
  buildWhatsAppLink,
  CAMPAIGN_PRESETS,
  LinkBuilderError,
  messageCharacterCount,
  normalizeCampaignValue,
} from "./campaign-links";
import { parseQrHandoff, serializeQrHandoff } from "./tool-handoff";

describe("normalizeCampaignValue", () => {
  it("creates lowercase snake_case values without accents", () => {
    expect(normalizeCampaignValue(" Lançamento: Versão 2 ")).toBe(
      "lancamento_versao_2",
    );
  });
});

describe("buildCampaignUrl", () => {
  it("adds HTTPS and preserves query parameters and fragments", () => {
    expect(
      buildCampaignUrl({
        destination: "belluzzi.dev/servicos?ref=partner#contact",
        source: "Instagram",
        medium: "Social Orgânico",
        campaign: "Lançamento 2026",
        content: "Bio Principal",
        term: "",
        normalizeValues: true,
      }),
    ).toBe(
      "https://belluzzi.dev/servicos?ref=partner&utm_source=instagram&utm_medium=social_organico&utm_campaign=lancamento_2026&utm_content=bio_principal#contact",
    );
  });

  it("replaces existing UTMs instead of duplicating them", () => {
    const result = new URL(
      buildCampaignUrl({
        destination:
          "https://example.com/?utm_source=old&utm_medium=old&utm_campaign=old",
        source: "google",
        medium: "cpc",
        campaign: "new",
        normalizeValues: false,
      }),
    );

    expect(result.searchParams.getAll("utm_source")).toEqual(["google"]);
    expect(result.searchParams.getAll("utm_medium")).toEqual(["cpc"]);
    expect(result.searchParams.getAll("utm_campaign")).toEqual(["new"]);
  });

  it("requires an HTTP destination and the three core UTM fields", () => {
    expect(() =>
      buildCampaignUrl({
        destination: "ftp://example.com/file",
        source: "google",
        medium: "cpc",
        campaign: "launch",
        normalizeValues: true,
      }),
    ).toThrowError(new LinkBuilderError("destinationInvalid"));

    expect(() =>
      buildCampaignUrl({
        destination: "https://example.com",
        source: "",
        medium: "cpc",
        campaign: "launch",
        normalizeValues: true,
      }),
    ).toThrowError(new LinkBuilderError("campaignFieldsRequired"));
  });

  it("exposes consistent built-in presets", () => {
    expect(CAMPAIGN_PRESETS.googleAds).toEqual({ source: "google", medium: "cpc" });
    expect(CAMPAIGN_PRESETS.metaAds).toEqual({ source: "meta", medium: "paid_social" });
    expect(CAMPAIGN_PRESETS.instagramOrganic).toEqual({ source: "instagram", medium: "social" });
    expect(CAMPAIGN_PRESETS.newsletter).toEqual({ source: "newsletter", medium: "email" });
  });
});

describe("buildWhatsAppLink", () => {
  it("normalizes the phone and encodes emoji and line breaks", () => {
    expect(
      buildWhatsAppLink(
        "+55 (35) 99999-0000",
        "Olá! 👋\nQuero conhecer o projeto.",
      ),
    ).toBe(
      "https://wa.me/5535999990000?text=Ol%C3%A1!%20%F0%9F%91%8B%0AQuero%20conhecer%20o%20projeto.",
    );
  });

  it("supports a phone-only link and rejects invalid lengths", () => {
    expect(buildWhatsAppLink("+1 555 123 4567", "")).toBe(
      "https://wa.me/15551234567",
    );
    expect(() => buildWhatsAppLink("123", "hello")).toThrowError(
      new LinkBuilderError("phoneInvalid"),
    );
  });

  it("counts Unicode characters instead of UTF-16 units", () => {
    expect(messageCharacterCount("Oi 👋")).toBe(4);
  });
});

describe("QR handoff", () => {
  it("round-trips a valid payload", () => {
    const payload = "https://example.com/?utm_source=google";
    expect(parseQrHandoff(serializeQrHandoff(payload))).toBe(payload);
  });

  it("rejects malformed or unsupported values", () => {
    expect(parseQrHandoff("not-json")).toBeNull();
    expect(parseQrHandoff('{"version":2,"payload":"https://example.com"}')).toBeNull();
    expect(parseQrHandoff('{"version":1,"payload":""}')).toBeNull();
  });
});
