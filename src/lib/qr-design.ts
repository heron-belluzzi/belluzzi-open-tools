export const MIN_QR_CONTRAST = 4.5;

function channelToLinear(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hexColor: string) {
  const normalized = hexColor.replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(normalized)) return 0;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return (
    0.2126 * channelToLinear(red) +
    0.7152 * channelToLinear(green) +
    0.0722 * channelToLinear(blue)
  );
}

export function contrastRatio(firstColor: string, secondColor: string) {
  const first = relativeLuminance(firstColor);
  const second = relativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function addLogoToSvg(
  svg: string,
  logoDataUrl: string,
  background: string,
) {
  const overlay = [
    `<rect x="38%" y="38%" width="24%" height="24%" rx="2.5%" fill="${background}"/>`,
    `<image href="${logoDataUrl}" x="41%" y="41%" width="18%" height="18%" preserveAspectRatio="xMidYMid meet"/>`,
  ].join("");

  return svg.replace("</svg>", `${overlay}</svg>`);
}
