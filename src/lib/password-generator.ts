export type PasswordOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

export type PassphraseOptions = {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
};

export type PasswordStrength = "weak" | "fair" | "strong" | "veryStrong";
export type RandomInt = (maximum: number) => number;

const CHARACTER_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
} as const;

const AMBIGUOUS_CHARACTERS = new Set("O0oIl1|");

export function secureRandomInt(maximum: number) {
  if (!Number.isSafeInteger(maximum) || maximum <= 0 || maximum > 2 ** 32) {
    throw new RangeError("Maximum must be an integer between 1 and 2^32");
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Web Crypto is unavailable");
  }

  const range = 2 ** 32;
  const limit = range - (range % maximum);
  const values = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % maximum;
}

function withoutAmbiguousCharacters(characters: string) {
  return [...characters]
    .filter((character) => !AMBIGUOUS_CHARACTERS.has(character))
    .join("");
}

export function getPasswordCharacterSets(options: PasswordOptions) {
  const selected = (
    ["lowercase", "uppercase", "numbers", "symbols"] as const
  )
    .filter((key) => options[key])
    .map((key) => CHARACTER_SETS[key]);

  return options.excludeAmbiguous
    ? selected.map(withoutAmbiguousCharacters)
    : selected;
}

export function generatePassword(
  options: PasswordOptions,
  randomInt: RandomInt = secureRandomInt,
) {
  const characterSets = getPasswordCharacterSets(options);
  if (characterSets.length === 0) {
    throw new Error("Select at least one character set");
  }
  if (!Number.isInteger(options.length) || options.length < characterSets.length) {
    throw new Error("Password length is too short for the selected rules");
  }

  const pool = characterSets.join("");
  for (let attempt = 0; attempt < 1_000; attempt += 1) {
    const password = Array.from(
      { length: options.length },
      () => pool[randomInt(pool.length)],
    ).join("");

    if (
      characterSets.every((characterSet) =>
        [...password].some((character) => characterSet.includes(character)),
      )
    ) {
      return password;
    }
  }

  throw new Error("Unable to satisfy the selected password rules");
}

export function estimatePasswordEntropy(options: PasswordOptions) {
  const sizes = getPasswordCharacterSets(options).map((set) => set.length);
  if (sizes.length === 0 || options.length < sizes.length) return 0;

  const poolSize = sizes.reduce((total, size) => total + size, 0);
  let validProbability = 0;

  for (let mask = 0; mask < 2 ** sizes.length; mask += 1) {
    let removedSize = 0;
    let removedSets = 0;
    sizes.forEach((size, index) => {
      if (mask & (1 << index)) {
        removedSize += size;
        removedSets += 1;
      }
    });
    const probability = ((poolSize - removedSize) / poolSize) ** options.length;
    validProbability += removedSets % 2 === 0 ? probability : -probability;
  }

  if (validProbability <= 0) return 0;
  return options.length * Math.log2(poolSize) + Math.log2(validProbability);
}

export function generatePassphrase(
  options: PassphraseOptions,
  wordlist: readonly string[],
  randomInt: RandomInt = secureRandomInt,
) {
  if (wordlist.length < 2) throw new Error("Wordlist is unavailable");
  if (!Number.isInteger(options.wordCount) || options.wordCount < 2) {
    throw new Error("Passphrase must contain at least two words");
  }

  const words = Array.from({ length: options.wordCount }, () => {
    const word = wordlist[randomInt(wordlist.length)];
    return options.capitalize
      ? `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`
      : word;
  });

  if (options.includeNumber) {
    words.push(randomInt(100).toString().padStart(2, "0"));
  }

  return words.join(options.separator);
}

export function estimatePassphraseEntropy(
  options: PassphraseOptions,
  wordlistLength: number,
) {
  if (wordlistLength < 2 || options.wordCount < 1) return 0;
  const wordsEntropy = options.wordCount * Math.log2(wordlistLength);
  return wordsEntropy + (options.includeNumber ? Math.log2(100) : 0);
}

export function strengthFromEntropy(entropy: number): PasswordStrength {
  if (entropy < 40) return "weak";
  if (entropy < 60) return "fair";
  if (entropy < 80) return "strong";
  return "veryStrong";
}
