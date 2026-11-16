const blockedHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com|www\.example\.com)$/i;

export function assertProductionOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /your-domain/i.test(trimmed)) {
    throw new Error("VITE_SITE_URL must be the public https origin");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("VITE_SITE_URL must be an absolute https URL");
  }
  if (url.protocol !== "https:") throw new Error("VITE_SITE_URL must use https");
  if (url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
    throw new Error("VITE_SITE_URL must be an origin without a path");
  }
  if (blockedHost.test(url.hostname) || url.hostname.endsWith(".local")) {
    throw new Error("VITE_SITE_URL must not be a local or example host");
  }
  return url.origin;
}

export function resolveSiteOrigin(raw: string, production: boolean): string {
  if (production) return assertProductionOrigin(raw);
  if (!raw.trim()) return "http://127.0.0.1:5173";
  const url = new URL(raw.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("VITE_SITE_URL must be http or https");
  return url.origin;
}
