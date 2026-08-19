export const QR_HANDOFF_STORAGE_KEY = "belluzzi-open-tools:qr-handoff:v1";

type QrHandoff = {
  version: 1;
  payload: string;
};

export function serializeQrHandoff(payload: string) {
  const handoff: QrHandoff = { version: 1, payload };
  return JSON.stringify(handoff);
}

export function parseQrHandoff(value: string | null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<QrHandoff>;
    if (
      parsed.version !== 1 ||
      typeof parsed.payload !== "string" ||
      !parsed.payload.trim() ||
      parsed.payload.length > 10_000
    ) {
      return null;
    }
    return parsed.payload;
  } catch {
    return null;
  }
}
