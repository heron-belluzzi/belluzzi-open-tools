import { describe, expect, it } from "vitest";
import {
  estimatePassphraseEntropy,
  estimatePasswordEntropy,
  generatePassphrase,
  generatePassword,
  secureRandomInt,
  strengthFromEntropy,
  type PasswordOptions,
  type RandomInt,
} from "./password-generator";

const basePasswordOptions: PasswordOptions = {
  length: 8,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

function sequenceRandom(values: number[]): RandomInt {
  let index = 0;
  return (maximum) => values[index++ % values.length] % maximum;
}

describe("generatePassword", () => {
  it("satisfies every selected character rule", () => {
    const password = generatePassword(
      basePasswordOptions,
      sequenceRandom([0, 26, 52, 62, 1, 27, 53, 63]),
    );

    expect(password).toHaveLength(8);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/\d/);
    expect(password).toMatch(/[^A-Za-z\d]/);
  });

  it("removes visually ambiguous characters", () => {
    const password = generatePassword(
      {
        ...basePasswordOptions,
        length: 20,
        uppercase: false,
        numbers: false,
        symbols: false,
        excludeAmbiguous: true,
      },
      sequenceRandom([0, 1, 2, 3, 4, 5]),
    );

    expect(password).not.toMatch(/[oIl1O0|]/);
  });

  it("rejects an empty character selection", () => {
    expect(() =>
      generatePassword({
        ...basePasswordOptions,
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
      }),
    ).toThrow(/at least one/i);
  });
});

describe("generatePassphrase", () => {
  it("selects words and an optional two-digit number", () => {
    expect(
      generatePassphrase(
        {
          wordCount: 3,
          separator: "-",
          capitalize: true,
          includeNumber: true,
        },
        ["amora", "brisa", "caminho"],
        sequenceRandom([0, 1, 2, 7]),
      ),
    ).toBe("Amora-Brisa-Caminho-07");
  });
});

describe("entropy estimates", () => {
  it("calculates one uniformly selected lowercase character", () => {
    expect(
      estimatePasswordEntropy({
        ...basePasswordOptions,
        length: 1,
        uppercase: false,
        numbers: false,
        symbols: false,
      }),
    ).toBeCloseTo(Math.log2(26), 8);
  });

  it("uses eleven bits per BIP39 word", () => {
    expect(
      estimatePassphraseEntropy(
        {
          wordCount: 6,
          separator: "-",
          capitalize: false,
          includeNumber: false,
        },
        2_048,
      ),
    ).toBe(66);
  });

  it("maps entropy to transparent strength bands", () => {
    expect(strengthFromEntropy(39)).toBe("weak");
    expect(strengthFromEntropy(40)).toBe("fair");
    expect(strengthFromEntropy(60)).toBe("strong");
    expect(strengthFromEntropy(80)).toBe("veryStrong");
  });
});

describe("secureRandomInt", () => {
  it("returns values inside the requested range", () => {
    const values = Array.from({ length: 64 }, () => secureRandomInt(17));
    expect(values.every((value) => value >= 0 && value < 17)).toBe(true);
  });
});
