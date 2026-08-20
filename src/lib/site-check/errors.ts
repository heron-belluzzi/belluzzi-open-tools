import type { SiteCheckErrorCode } from "./types";

export class SiteCheckError extends Error {
  constructor(
    public readonly code: SiteCheckErrorCode,
    message = code,
  ) {
    super(message);
    this.name = "SiteCheckError";
  }
}

export function toSiteCheckError(error: unknown) {
  if (error instanceof SiteCheckError) return error;
  return new SiteCheckError("TARGET_UNREACHABLE");
}

