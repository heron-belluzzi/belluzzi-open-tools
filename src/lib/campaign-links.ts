import { buildWhatsAppPayload, normalizeWebUrl } from "./qr-payload";

export type CampaignPresetId =
  | "googleAds"
  | "metaAds"
  | "instagramOrganic"
  | "newsletter";

export type CampaignLinkOptions = {
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  normalizeValues: boolean;
};

export type LinkBuilderErrorCode =
  | "destinationRequired"
  | "destinationInvalid"
  | "campaignFieldsRequired"
  | "phoneInvalid";

export class LinkBuilderError extends Error {
  constructor(public readonly code: LinkBuilderErrorCode) {
    super(code);
    this.name = "LinkBuilderError";
  }
}

export const CAMPAIGN_PRESETS: Record<
  CampaignPresetId,
  { source: string; medium: string }
> = {
  googleAds: { source: "google", medium: "cpc" },
  metaAds: { source: "meta", medium: "paid_social" },
  instagramOrganic: { source: "instagram", medium: "social" },
  newsletter: { source: "newsletter", medium: "email" },
};

export const CAMPAIGN_URL_WARNING_LENGTH = 2_000;

export function normalizeCampaignValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function campaignValue(value: string, normalizeValues: boolean) {
  return normalizeValues ? normalizeCampaignValue(value) : value.trim();
}

export function buildCampaignUrl(options: CampaignLinkOptions) {
  if (!options.destination.trim()) {
    throw new LinkBuilderError("destinationRequired");
  }

  let url: URL;
  try {
    url = new URL(normalizeWebUrl(options.destination));
  } catch {
    throw new LinkBuilderError("destinationInvalid");
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new LinkBuilderError("destinationInvalid");
  }

  const requiredValues = [options.source, options.medium, options.campaign].map(
    (value) => campaignValue(value, options.normalizeValues),
  );
  if (requiredValues.some((value) => !value)) {
    throw new LinkBuilderError("campaignFieldsRequired");
  }

  const fields = {
    utm_source: requiredValues[0],
    utm_medium: requiredValues[1],
    utm_campaign: requiredValues[2],
    utm_content: campaignValue(options.content ?? "", options.normalizeValues),
    utm_term: campaignValue(options.term ?? "", options.normalizeValues),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }

  return url.toString();
}

export function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function isValidWhatsAppPhone(phone: string) {
  const digits = normalizeWhatsAppPhone(phone);
  return digits.length >= 8 && digits.length <= 15;
}

export function buildWhatsAppLink(phone: string, message: string) {
  if (!isValidWhatsAppPhone(phone)) {
    throw new LinkBuilderError("phoneInvalid");
  }

  return buildWhatsAppPayload(phone, message);
}

export function messageCharacterCount(message: string) {
  return [...message].length;
}
