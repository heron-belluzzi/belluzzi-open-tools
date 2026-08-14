export type WifiEncryption = "WPA" | "WEP" | "nopass";

export type ContactPayload = {
  name: string;
  organization?: string;
  phone?: string;
  email?: string;
  website?: string;
};

export type EventPayload = {
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
};

export function normalizeWebUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function escapeWifiValue(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function escapeCalendarValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function formatCalendarDate(value: string) {
  const normalized = value.replace(/[-:]/g, "").replace(/\.\d+$/, "");
  return normalized.length === 13 ? `${normalized}00` : normalized;
}

export function buildWifiPayload(options: {
  ssid: string;
  password?: string;
  encryption: WifiEncryption;
  hidden?: boolean;
}) {
  const ssid = escapeWifiValue(options.ssid.trim());
  const password = escapeWifiValue(options.password?.trim() ?? "");
  const passwordField = options.encryption === "nopass" ? "" : `P:${password};`;

  return `WIFI:T:${options.encryption};S:${ssid};${passwordField}H:${options.hidden ? "true" : "false"};;`;
}

export function buildContactPayload(contact: ContactPayload) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardValue(contact.name.trim())}`,
  ];

  if (contact.organization?.trim()) {
    lines.push(`ORG:${escapeVCardValue(contact.organization.trim())}`);
  }
  if (contact.phone?.trim()) {
    lines.push(`TEL:${escapeVCardValue(contact.phone.trim())}`);
  }
  if (contact.email?.trim()) {
    lines.push(`EMAIL:${escapeVCardValue(contact.email.trim())}`);
  }
  if (contact.website?.trim()) {
    lines.push(`URL:${normalizeWebUrl(contact.website)}`);
  }

  lines.push("END:VCARD");
  return lines.join("\n");
}

export function buildWhatsAppPayload(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const query = message.trim()
    ? `?text=${encodeURIComponent(message.trim())}`
    : "";
  return `https://wa.me/${digits}${query}`;
}

export function buildEmailPayload(options: {
  email: string;
  subject?: string;
  body?: string;
}) {
  const params = new URLSearchParams();
  if (options.subject?.trim()) params.set("subject", options.subject.trim());
  if (options.body?.trim()) params.set("body", options.body.trim());
  const query = params.toString();

  return `mailto:${options.email.trim()}${query ? `?${query}` : ""}`;
}

export function buildEventPayload(event: EventPayload) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//Belluzzi Open Tools//QR Studio//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeCalendarValue(event.title.trim())}`,
    `DTSTART:${formatCalendarDate(event.start.trim())}`,
    `DTEND:${formatCalendarDate(event.end.trim())}`,
  ];

  if (event.location?.trim()) {
    lines.push(`LOCATION:${escapeCalendarValue(event.location.trim())}`);
  }
  if (event.description?.trim()) {
    lines.push(`DESCRIPTION:${escapeCalendarValue(event.description.trim())}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
