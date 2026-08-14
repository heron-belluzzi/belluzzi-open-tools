import { describe, expect, it } from "vitest";
import { addLogoToSvg, contrastRatio, relativeLuminance } from "./qr-design";

describe("QR contrast", () => {
  it("calculates the maximum contrast between black and white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  });

  it("identifies low-contrast colors", () => {
    expect(contrastRatio("#777777", "#888888")).toBeLessThan(1.3);
  });
});

describe("addLogoToSvg", () => {
  it("adds a centered logo and protective plate", () => {
    const result = addLogoToSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      "data:image/png;base64,AAAA",
      "#ffffff",
    );

    expect(result).toContain("<rect");
    expect(result).toContain('<image href="data:image/png;base64,AAAA"');
    expect(result).toContain('x="41%"');
    expect(result).toMatch(/<\/svg>$/);
  });
});
