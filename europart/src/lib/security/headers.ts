/** Baseline response headers for storefront + admin (no secrets). */

export type SecurityHeaderMap = Record<string, string>;

/**
 * Apply when NEXT_PUBLIC_SITE_URL is https (production canonical host).
 * Edge/proxy terminates TLS; HSTS still tells browsers to prefer HTTPS.
 */
export function buildSecurityHeaders(input?: {
  siteUrl?: string | null;
  includeHsts?: boolean;
}): SecurityHeaderMap {
  const siteUrl = (input?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const https =
    input?.includeHsts === true ||
    (input?.includeHsts !== false && siteUrl.toLowerCase().startsWith("https://"));

  const headers: SecurityHeaderMap = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "off",
  };

  if (https) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }

  return headers;
}

export function applySecurityHeaders(
  target: Headers,
  input?: { siteUrl?: string | null; includeHsts?: boolean },
): void {
  for (const [key, value] of Object.entries(buildSecurityHeaders(input))) {
    target.set(key, value);
  }
}
